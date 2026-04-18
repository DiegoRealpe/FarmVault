import { defineFunction } from "@aws-amplify/backend";

export const listVisibleDevicesFn = defineFunction({
  name: "list-visible-devices",
  entry: "./handler.ts",
});
