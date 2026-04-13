import { defineFunction } from "@aws-amplify/backend";

export const getGrantRecordFn = defineFunction({
  name: "get-grant-record",
  entry: "./handler.ts",
});