import { defineFunction } from "@aws-amplify/backend";

export const listVisibleFarmsFn = defineFunction({
  name: "list-visible-farms",
  entry: "./handler.ts",
});
