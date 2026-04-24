import { defineFunction } from "@aws-amplify/backend";

export const createFarmUserFn = defineFunction({
  name: "create-farm-user",
  entry: "./handler.ts",
});
