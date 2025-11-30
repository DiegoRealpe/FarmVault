import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { listAllDevicesFn } from "./functions/list-all-devices/resource";
import { metricsBucket } from "./storage/resource";
import { getFarmIotDataFn } from "./functions/get-farm-iot-data/resource";

defineBackend({
  auth,
  data,
  metricsBucket,
  listAllDevicesFn,
  getFarmIotDataFn
});
