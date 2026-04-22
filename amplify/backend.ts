import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { metricsBucket } from "./storage/resource";
// Lambda function resources
import { createFarmUserFn } from "./functions/create-farm-user/resource";
// import { getFarmIotDataFn } from "./functions/get-farm-iot-data/resource";
// import { getPersonalGrantRecordFn } from "./functions/get-personal-grant-record/resource";
// import { listVisibleDevicesFn } from "./functions/list-visible-devices/resource";
// import { listVisibleFarmsFn } from "./functions/list-visible-farms/resource";
// import { listCreatedGrantRecordsFn } from "./functions/list-created-grant-records/resource";
// import { upsertGrantRecordFn } from "./functions/upsert-grant-record/resource";
// CDK Imports
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { CfnDatabase, CfnTable, CfnJob, CfnCrawler } from "aws-cdk-lib/aws-glue";
import { Role, ServicePrincipal, ManagedPolicy } from "aws-cdk-lib/aws-iam";
// import * as athena from "aws-cdk-lib/aws-athena";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { Stack } from "aws-cdk-lib";

// ESM-compatible __dirname / __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const backend = defineBackend({
  auth,
  data,
  metricsBucket,
  createFarmUserFn,
  getFarmIotDataFn,
  // getPersonalGrantRecordFn,
  // listVisibleDevicesFn,
  // listVisibleFarmsFn,
  // listCreatedGrantRecordsFn,
  // upsertGrantRecordFn,
});

// Only allow administrators to create users
backend.auth.resources.cfnResources.cfnUserPool.adminCreateUserConfig = {
  allowAdminCreateUserOnly: true,
};

const bucket = backend.metricsBucket.resources.bucket;

new BucketDeployment(backend.stack, "DeployGlueScripts", {
  destinationBucket: bucket,
  destinationKeyPrefix: "script/",
  sources: [Source.asset(join(__dirname, "glue-scripts"))],
});

backend.getFarmIotDataFn.resources.lambda.role?.addManagedPolicy(
  ManagedPolicy.fromAwsManagedPolicyName('AmazonAthenaFullAccess')
)

const glueStack = backend.createStack("GlueInfra");

// Glue Catalog account id (same as stack account)
const catalogId = Stack.of(glueStack).account;

const glueDb = new CfnDatabase(glueStack, "IotTelemetryDb", {
  catalogId,
  databaseInput: {
    name: "iot_telemetry", // name in Glue Data Catalog
  },
});

const glueTable = new CfnTable(glueStack, "IotTelemetryParquetTable", {
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

const glueJobRole = new Role(glueStack, "GlueJobRole", {
  assumedBy: new ServicePrincipal("glue.amazonaws.com"),
});
glueJobRole.addManagedPolicy(
  ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSGlueServiceRole"),
);
bucket.grantReadWrite(glueJobRole);

new CfnJob(glueStack, "IotTestWriteParquetJob", {
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

const glueCrawlerRole = new Role(glueStack, "GlueCrawlerRole", {
  assumedBy: new ServicePrincipal("glue.amazonaws.com"),
});
glueCrawlerRole.addManagedPolicy(
  ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSGlueServiceRole"),
);
bucket.grantRead(glueCrawlerRole);

const crawler = new CfnCrawler(glueStack, "IotParquetCrawler", {
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