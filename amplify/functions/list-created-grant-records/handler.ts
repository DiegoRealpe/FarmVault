import type { Schema } from "../../data/resource";

type ListCreatedGrantRecordsHandler =
  Schema["listCreatedGrantRecords"]["functionHandler"];

export const handler: ListCreatedGrantRecordsHandler = async (event) => {
  console.log(
    "listCreatedGrantRecords event:",
    JSON.stringify(event, null, 2),
  );

  return [];
};

// amplify/functions/list-created-grant-records/handler.ts
// import type { Schema } from "../../data/resource";
// import { Amplify } from "aws-amplify";
// import { generateClient } from "aws-amplify/data";
// import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
// import { env } from "$amplify/env/list-created-grant-records";

// const { resourceConfig, libraryOptions } =
//   await getAmplifyDataClientConfig(env);
// Amplify.configure(resourceConfig, libraryOptions);

// const client = generateClient<Schema>();

// type ListCreatedGrantRecordsHandler =
//   Schema["listCreatedGrantRecords"]["functionHandler"];
// type GrantRecord = Schema["GrantRecord"]["type"];
// type Identity = Parameters<ListCreatedGrantRecordsHandler>[0]["identity"];

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

// export const handler: ListCreatedGrantRecordsHandler = async (event) => {
//   console.log("listCreatedGrantRecords event:", JSON.stringify(event, null, 2));

//   const callerSub = getCallerSub(event.identity);

//   if (!callerSub) {
//     throw new Error("This endpoint requires Cognito userPool auth.");
//   }

//   const { data, errors } = await client.models.GrantRecord.list({
//     filter: {
//       createdBySub: { eq: callerSub },
//     },
//   });

//   if (errors?.length) {
//     throw new Error(errors.map((error) => error.message).join("; "));
//   }

//   const grantRecords: GrantRecord[] = (data ?? []).filter(
//     (record): record is GrantRecord => record != null,
//   );

//   return grantRecords;
// };