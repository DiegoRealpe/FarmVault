import { defineFunction } from "@aws-amplify/backend";

export const getMyUserAccessFn = defineFunction({
  name: "get-my-user-access",
  entry: "./handler.ts",
});