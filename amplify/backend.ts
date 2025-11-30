import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { metricsBucket } from "./storage/resource";
import { listAllDevicesFn } from "./functions/list-all-devices/resource";
import { getFarmIotDataFn } from "./functions/get-farm-iot-data/resource";
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { Stack } from "aws-cdk-lib";

// ESM-compatible __dirname / __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const backend = defineBackend({
  auth,
  data,
  metricsBucket,
  listAllDevicesFn,
  getFarmIotDataFn
});

const glueAssetsStack = backend.createStack('GlueAssets');

// Get the S3 bucket created by Amplify Storage
const bucket = backend.metricsBucket.resources.bucket;

// Deploy local glue-scripts/ folder into s3://<bucket>/script/
new s3deploy.BucketDeployment(glueAssetsStack, 'DeployGlueScripts', {
  destinationBucket: bucket,
  destinationKeyPrefix: 'script/', // will result in script/iot_json_to_parquet.py
  sources: [
    s3deploy.Source.asset(
      path.join(__dirname, 'glue-scripts')
    ),
  ],
});

const glueStack = backend.createStack('GlueInfra');

// Glue Catalog account id (same as stack account)
const catalogId = Stack.of(glueStack).account;

// 1) Glue Database (CfnDatabase)
const glueDb = new glue.CfnDatabase(glueStack, 'IotTelemetryDb', {
  catalogId,
  databaseInput: {
    name: 'iot_telemetry', // name in Glue Data Catalog
  },
});

// 2) Glue Table pointing at Parquet output (CfnTable)
const glueTable = new glue.CfnTable(glueStack, 'IotTelemetryParquetTable', {
  catalogId,
  databaseName: glueDb.ref, // or 'iot_telemetry'
  tableInput: {
    name: 'iot_metrics_parquet',
    tableType: 'EXTERNAL_TABLE',
    storageDescriptor: {
      location: `s3://${bucket.bucketName}/parquet/`,
      inputFormat:
        'org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat',
      outputFormat:
        'org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat',
      serdeInfo: {
        serializationLibrary:
          'org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe',
      },
      columns: [
        { name: 'id', type: 'string' },
        { name: 'payload', type: 'string' },
        { name: 'moisture', type: 'int' },
        { name: 'timestamp', type: 'string' },
        { name: 'event_ts', type: 'timestamp' },
        { name: 'application_id', type: 'string' },
        { name: 'device_id', type: 'string' },
        { name: 'gateway_id', type: 'string' },
      ],
    },
  },
});

// Make sure table is created after database
glueTable.addDependency(glueDb);

// 3) Glue Job role (IAM)
const glueJobRole = new iam.Role(glueStack, 'GlueJobRole', {
  assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
});

// Standard Glue service role policy
glueJobRole.addManagedPolicy(
  iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole'),
);

// Allow the job to read & write in our data lake bucket
bucket.grantReadWrite(glueJobRole);

// 4) Glue Job (CfnJob) running test_write_parquet.py
const glueJob = new glue.CfnJob(glueStack, 'IotTestWriteParquetJob', {
  name: 'iot-test-write-parquet', // visible name in Glue console
  role: glueJobRole.roleArn,
  command: {
    name: 'glueetl', // Spark-based Glue ETL job
    pythonVersion: '3',
    scriptLocation: `s3://${bucket.bucketName}/script/iot_json_to_parquet.py`,
  },
  glueVersion: '4.0',
  defaultArguments: {
    '--job-language': 'python',
    '--enable-metrics': 'true',
    // Argument your script reads as OUTPUT_S3_PATH
    '--PARQUET_S3_PATH': `s3://${bucket.bucketName}/parquet/`,
  },
});

// 5) Glue Crawler role (IAM)
const glueCrawlerRole = new iam.Role(glueStack, 'GlueCrawlerRole', {
  assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
});

glueCrawlerRole.addManagedPolicy(
  iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole'),
);

// Crawler just needs read access on the bucket
bucket.grantRead(glueCrawlerRole);

// 6) Glue Crawler (CfnCrawler) to scan Parquet in /parquet/
const crawler = new glue.CfnCrawler(glueStack, 'IotParquetCrawler', {
  name: 'iot-parquet-crawler',
  role: glueCrawlerRole.roleArn,
  databaseName: glueDb.ref,
  tablePrefix: 'iot_', // tables created by crawler will start with 'iot_'
  targets: {
    s3Targets: [
      {
        path: `s3://${bucket.bucketName}/parquet/`,
      },
    ],
  },
});

// Optional: ensure crawler sees DB
crawler.addDependency(glueDb);
crawler.addDependency(glueJob);