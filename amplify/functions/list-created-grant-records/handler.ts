import type { Schema } from "../../data/resource";

import { Amplify } from "aws-amplify";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/list-created-grant-records";

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);

type ListCreatedGrantRecordsHandler =
  Schema["listCreatedGrantRecords"]["functionHandler"];

export const handler: ListCreatedGrantRecordsHandler = async (event) => {
  console.log(
    "listCreatedGrantRecords event:",
    JSON.stringify(event, null, 2),
  );

  return [];
};