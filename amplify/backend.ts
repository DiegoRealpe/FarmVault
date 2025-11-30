import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { metricsBucket } from "./storage/resource";
import { listAllDevicesFn } from "./functions/list-all-devices/resource";
import { getFarmIotDataFn } from "./functions/get-farm-iot-data/resource";
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
// import * as glue from 'aws-cdk-lib/aws-glue';
// import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { fileURLToPath } from 'url';

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

// const glueStack = backend.createStack('GlueInfra');
