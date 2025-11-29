import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { listAllDevicesFn } from "./functions/list-all-devices/resource";

defineBackend({
  auth,
  data,
  listAllDevicesFn,
});
