import { defineFunction } from "@aws-amplify/backend";

export const getFarmIotDataFn = defineFunction({
  name: "get-farm-iot-data",
  entry: "./handler.ts",
});
