import type { Schema } from "../../data/resource";

import { Amplify } from "aws-amplify";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/upsert-grant-record";

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions
  
);

type UpsertGrantRecordHandler =
  Schema["upsertGrantRecord"]["functionHandler"];

export const handler: UpsertGrantRecordHandler = async (event) => {
  console.log("upsertGrantRecord event:", JSON.stringify(event, null, 2));

  throw new Error("upsertGrantRecordFn not implemented yet.");
};

// amplify/functions/upsert-grant-record/handler.ts
// import type { Schema } from "../../data/resource";
// import { Amplify } from "aws-amplify";
// import { generateClient } from "aws-amplify/data";
// import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
// import { env } from "$amplify/env/upsert-grant-record";

// const { resourceConfig, libraryOptions } =
//   await getAmplifyDataClientConfig(env);
// Amplify.configure(resourceConfig, libraryOptions);

// const client = generateClient<Schema>();

// type UpsertGrantRecordHandler = Schema["upsertGrantRecord"]["functionHandler"];
// type Identity = Parameters<UpsertGrantRecordHandler>[0]["identity"];
// type UpsertGrantRecordArguments =
//   Parameters<UpsertGrantRecordHandler>[0]["arguments"];
// type GrantRecord = Schema["GrantRecord"]["type"];
// type UpsertGrantRecordResult = Schema["UpsertGrantRecordResult"]["type"];

// function getCallerSub(identity: Identity): string | null {
//   if (!identity) {
//     return null;
//   }

//   if ("sub" in identity && typeof identity.sub === "string") {
//     return identity.sub;
//   }

//   if (
//     "claims" in identity &&
//     identity.claims &&
//     typeof identity.claims === "object" &&
//     "sub" in identity.claims &&
//     typeof identity.claims.sub === "string"
//   ) {
//     return identity.claims.sub;
//   }

//   return null;
// }

// function toEpochSeconds(isoDateTime: string): number {
//   const ms = new Date(isoDateTime).getTime();

//   if (Number.isNaN(ms)) {
//     throw new Error(`Invalid expiresAt value: ${isoDateTime}`);
//   }

//   return Math.floor(ms / 1000);
// }

// function sanitizeGrants(
//   grants: UpsertGrantRecordArguments["grants"],
// ): NonNullable<GrantRecord["grants"]> {
//   return (grants ?? [])
//     .filter((grant): grant is NonNullable<typeof grant> => grant != null)
//     .map((grant) => ({
//       grantType: grant.grantType,
//       ids: (grant.ids ?? [])
//         .filter((id): id is string => typeof id === "string")
//         .map((id) => id.trim())
//         .filter(Boolean),
//     }))
//     .filter((grant) => grant.ids.length > 0);
// }

// function toResult(record: GrantRecord): UpsertGrantRecordResult {
//   return {
//     userSub: record.userSub,
//     grants: (record.grants ?? []).filter(
//       (grant): grant is NonNullable<typeof grant> => grant != null,
//     ),
//     expiresAt: record.expiresAt,
//     createdAt: record.createdAt,
//     updatedAt: record.updatedAt,
//   };
// }

// export const handler: UpsertGrantRecordHandler = async (event) => {
//   console.log("upsertGrantRecord event:", JSON.stringify(event, null, 2));

//   const adminSub = getCallerSub(event.identity);
//   if (!adminSub) {
//     throw new Error("This endpoint requires Cognito userPool auth.");
//   }

//   const { userSub, grants, expiresAt } = event.arguments;

//   if (!userSub) {
//     throw new Error("userSub is required.");
//   }

//   if (!expiresAt) {
//     throw new Error("expiresAt is required.");
//   }

//   const sanitizedGrants = sanitizeGrants(grants);
//   const ttl = toEpochSeconds(expiresAt);
//   const now = new Date().toISOString();

//   const existingResponse = await client.models.GrantRecord.get({ userSub });

//   if (existingResponse.errors?.length) {
//     throw new Error(
//       existingResponse.errors.map((error) => error.message).join("; "),
//     );
//   }

//   const existingRecord = existingResponse.data;

//   if (existingRecord) {
//     const updateResponse = await client.models.GrantRecord.update({
//       userSub,
//       grants: sanitizedGrants,
//       expiresAt,
//       ttl,
//       createdBySub: adminSub,
//       createdAt: existingRecord.createdAt,
//       updatedAt: now,
//     });

//     if (updateResponse.errors?.length) {
//       throw new Error(
//         updateResponse.errors.map((error) => error.message).join("; "),
//       );
//     }

//     if (!updateResponse.data) {
//       throw new Error("GrantRecord update returned no data.");
//     }

//     return toResult(updateResponse.data as GrantRecord);
//   }

//   const createResponse = await client.models.GrantRecord.create({
//     userSub,
//     grants: sanitizedGrants,
//     expiresAt,
//     ttl,
//     createdBySub: adminSub,
//     createdAt: now,
//     updatedAt: now,
//   });

//   if (createResponse.errors?.length) {
//     throw new Error(
//       createResponse.errors.map((error) => error.message).join("; "),
//     );
//   }

//   if (!createResponse.data) {
//     throw new Error("GrantRecord create returned no data.");
//   }

//   return toResult(createResponse.data as GrantRecord);
// };