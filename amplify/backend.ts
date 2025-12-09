import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { metricsBucket } from "./storage/resource";
import { listAllDevicesFn } from "./functions/list-all-devices/resource";
import { getFarmIotDataFn } from "./functions/get-farm-iot-data/resource";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as glue from "aws-cdk-lib/aws-glue";
import * as iam from "aws-cdk-lib/aws-iam";
// import * as athena from "aws-cdk-lib/aws-athena";
import * as path from "path";
import { fileURLToPath } from "url";
import { Stack } from "aws-cdk-lib";

// ESM-compatible __dirname / __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const backend = defineBackend({
  auth,
  data,
  metricsBucket,
  listAllDevicesFn,
  getFarmIotDataFn,
});

// Only allow administrators to create users
backend.auth.resources.cfnResources.cfnUserPool.adminCreateUserConfig = {
  allowAdminCreateUserOnly: true,
};

const bucket = backend.metricsBucket.resources.bucket;

new s3deploy.BucketDeployment(backend.stack, "DeployGlueScripts", {
  destinationBucket: bucket,
  destinationKeyPrefix: "script/",
  sources: [s3deploy.Source.asset(path.join(__dirname, "glue-scripts"))],
});

backend.getFarmIotDataFn.resources.lambda.role?.addManagedPolicy(
  iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonAthenaFullAccess')
)

const glueStack = backend.createStack("GlueInfra");

// Glue Catalog account id (same as stack account)
const catalogId = Stack.of(glueStack).account;

const glueDb = new glue.CfnDatabase(glueStack, "IotTelemetryDb", {
  catalogId,
  databaseInput: {
    name: "iot_telemetry", // name in Glue Data Catalog
  },
});

const glueTable = new glue.CfnTable(glueStack, "IotTelemetryParquetTable", {
  catalogId,
  databaseName: glueDb.ref, // 'iot_telemetry'
  tableInput: {
    name: "iot_metrics_parquet",
    tableType: "EXTERNAL_TABLE",
    storageDescriptor: {
      location: `s3://${bucket.bucketName}/parquet/`,
      inputFormat:
        "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat",
      outputFormat:
        "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat",
      serdeInfo: {
        serializationLibrary:
          "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe",
      },
      columns: [
        { name: "id", type: "string" },
        { name: "payload", type: "string" },
        { name: "moisture", type: "int" },
        { name: "timestamp", type: "string" },
        { name: "event_ts", type: "timestamp" },
        { name: "application_id", type: "string" },
        { name: "device_id", type: "string" },
        { name: "gateway_id", type: "string" },
      ],
    },
  },
});
glueTable.addDependency(glueDb);

const glueJobRole = new iam.Role(glueStack, "GlueJobRole", {
  assumedBy: new iam.ServicePrincipal("glue.amazonaws.com"),
});
glueJobRole.addManagedPolicy(
  iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSGlueServiceRole"),
);
bucket.grantReadWrite(glueJobRole);

new glue.CfnJob(glueStack, "IotTestWriteParquetJob", {
  name: "iot-test-write-parquet",
  role: glueJobRole.roleArn,
  command: {
    name: "glueetl",
    pythonVersion: "3",
    scriptLocation: `s3://${bucket.bucketName}/script/iot_json_to_parquet.py`,
  },
  glueVersion: "4.0",
  defaultArguments: {
    "--job-language": "python",
    "--enable-metrics": "true",
    "--PARQUET_S3_PATH": `s3://${bucket.bucketName}/parquet/`,
  },
});

const glueCrawlerRole = new iam.Role(glueStack, "GlueCrawlerRole", {
  assumedBy: new iam.ServicePrincipal("glue.amazonaws.com"),
});
glueCrawlerRole.addManagedPolicy(
  iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSGlueServiceRole"),
);
bucket.grantRead(glueCrawlerRole);

const crawler = new glue.CfnCrawler(glueStack, "IotParquetCrawler", {
  name: "iot-parquet-crawler",
  role: glueCrawlerRole.roleArn,
  databaseName: glueDb.ref,
  tablePrefix: "iot_", // tables created by crawler will start with 'iot_'
  targets: {
    s3Targets: [
      {
        path: `s3://${bucket.bucketName}/parquet/`,
      },
    ],
  },
});
crawler.addDependency(glueDb);

// const athenaWorkGroup = new athena.CfnWorkGroup(
//   glueStack,
//   "FarmVaultAthenaWg",
//   {
//     name: "farmvault-wg", // you'll refer to this in the console and in Lambda
//     workGroupConfiguration: {
//       resultConfiguration: {
//         outputLocation: `s3://${bucket.bucketName}/athena-results/`,
//       },
//       // Optional extras:
//       // enforceWorkGroupConfiguration: true,
//       // publishCloudWatchMetricsEnabled: true,
//     },
//   },
// );

// athenaWorkGroup.addDependency(glueJob);