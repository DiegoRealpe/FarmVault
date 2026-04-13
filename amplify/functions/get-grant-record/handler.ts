import type { Schema } from "../../data/resource";

type GetGrantRecordHandler =
  Schema["getGrantRecord"]["functionHandler"];

export const handler: GetGrantRecordHandler = async (event) => {
  console.log("getGrantRecord event:", JSON.stringify(event, null, 2));

  return null;
};

// amplify/functions/get-grant-record/handler.ts
// import type { Schema } from "../../data/resource";
// import { Amplify } from "aws-amplify";
// import { generateClient } from "aws-amplify/data";
// import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
// import { env } from "$amplify/env/get-grant-record";

// const { resourceConfig, libraryOptions } =
//   await getAmplifyDataClientConfig(env);
// Amplify.configure(resourceConfig, libraryOptions);

// const client = generateClient<Schema>();

// type GetGrantRecordHandler = Schema["getGrantRecord"]["functionHandler"];
// type GrantRecord = Schema["GrantRecord"]["type"];
// type MyGrantRecord = Schema["MyGrantRecord"]["type"];
// type Identity = Parameters<GetGrantRecordHandler>[0]["identity"];

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

// function toMyGrantRecord(record: GrantRecord): MyGrantRecord {
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

// export const handler: GetGrantRecordHandler = async (event) => {
//   console.log("getGrantRecord event:", JSON.stringify(event, null, 2));

//   const callerSub = getCallerSub(event.identity);

//   if (!callerSub) {
//     throw new Error("This endpoint requires Cognito userPool auth.");
//   }

//   const { data, errors } = await client.models.GrantRecord.get({
//     userSub: callerSub,
//   });

//   if (errors?.length) {
//     throw new Error(errors.map((error) => error.message).join("; "));
//   }

//   const grantRecord: GrantRecord | null | undefined = data;

//   if (grantRecord == null) {
//     return null;
//   }

//   return toMyGrantRecord(grantRecord);
// };