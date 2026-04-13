import { defineFunction } from "@aws-amplify/backend";

export const upsertGrantRecordFn = defineFunction({
  name: "upsert-grant-record",
  entry: "./handler.ts",
});
