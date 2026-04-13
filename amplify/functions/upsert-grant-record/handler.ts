import type { Schema } from "../../data/resource";

import { Amplify } from "aws-amplify";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/upsert-grant-record";

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);

type UpsertGrantRecordHandler =
  Schema["upsertGrantRecord"]["functionHandler"];

export const handler: UpsertGrantRecordHandler = async (event) => {
  console.log("upsertGrantRecord event:", JSON.stringify(event, null, 2));

  throw new Error("upsertGrantRecordFn not implemented yet.");
};