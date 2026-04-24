import { defineFunction } from "@aws-amplify/backend";

export const getPersonalGrantRecordFn = defineFunction({
  name: "get-personal-grant-record",
  entry: "./handler.ts",
});
