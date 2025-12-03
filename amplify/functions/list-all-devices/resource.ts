import { defineFunction } from "@aws-amplify/backend";

export const listAllDevicesFn = defineFunction({
  name: "list-all-devices",
  entry: "./handler.ts",
});
