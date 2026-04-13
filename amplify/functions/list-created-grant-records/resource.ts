import { defineFunction } from "@aws-amplify/backend";

export const listCreatedGrantRecordsFn = defineFunction({
  name: "list-created-grant-records",
  entry: "./handler.ts",
});
