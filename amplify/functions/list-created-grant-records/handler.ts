// amplify/functions/list-created-grant-records/handler.ts
import type { Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/list-created-grant-records";

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

type ListCreatedGrantRecordsHandler =
  Schema["listCreatedGrantRecords"]["functionHandler"];
type GrantRecord = Schema["GrantRecord"]["type"];
type Identity = Parameters<ListCreatedGrantRecordsHandler>[0]["identity"];

function getCallerSub(identity: Identity): string | null {
  if (!identity || typeof identity !== "object") {
    return null;
  }

  if ("sub" in identity && typeof identity.sub === "string") {
    return identity.sub;
  }

  return null;
}

function getGroups(identity: Identity): string[] {
  if (!identity || typeof identity !== "object") {
    return [];
  }

  if ("groups" in identity && Array.isArray(identity.groups)) {
    return identity.groups.filter(
      (group): group is string => typeof group === "string",
    );
  }

  return [];
}

function isAdmin(identity: Identity): boolean {
  return getGroups(identity).includes("admin");
}

export const handler: ListCreatedGrantRecordsHandler = async (event) => {
  console.log(
    "listCreatedGrantRecords event:",
    JSON.stringify(
      {
        arguments: event.arguments,
        identity: event.identity,
      },
      null,
      2,
    ),
  );

  const callerSub = getCallerSub(event.identity);

  if (!callerSub) {
    throw new Error("This endpoint requires Cognito userPool auth.");
  }

  if (!isAdmin(event.identity)) {
    throw new Error("Not authorized.");
  }

  const { data, errors } = await client.models.GrantRecord.list({
    filter: {
      createdBySub: { eq: callerSub },
    },
  });

  if (errors?.length) {
    throw new Error(
      `Failed to list created grant records: ${errors
        .map((error) => error.message)
        .join("; ")}`,
    );
  }

  const grantRecords = (data ?? []).filter(
    (record) => record != null,
  ) as GrantRecord[];

  return grantRecords;
};