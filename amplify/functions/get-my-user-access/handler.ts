import type { Schema } from "../../data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>({
  authMode: "userPool",
});

type GetMyUserAccessHandler = Schema["getMyUserAccess"]["functionHandler"];
type MyUserAccess = Schema["MyUserAccess"]["type"];
type UserAccess = Schema["UserAccess"]["type"];

function getCallerSub(
  identity: Parameters<GetMyUserAccessHandler>[0]["identity"]
): string | null {
  if (!identity) {
    return null;
  }

  if ("sub" in identity && typeof identity.sub === "string") {
    return identity.sub;
  }

  if (
    "claims" in identity &&
    identity.claims &&
    typeof identity.claims === "object" &&
    "sub" in identity.claims &&
    typeof identity.claims.sub === "string"
  ) {
    return identity.claims.sub;
  }

  return null;
}

export const handler: GetMyUserAccessHandler = async (event) => {
  const callerSub = getCallerSub(event.identity);

  if (!callerSub) {
    throw new Error("This endpoint requires Cognito userPool auth.");
  }

  const { data, errors } = await client.models.UserAccess.get({
    userSub: callerSub,
  });

  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join("; "));
  }

  const userAccessRecord: UserAccess | null = data;

  if (!userAccessRecord) {
    return null;
  }

  const result: MyUserAccess = {
    userSub: userAccessRecord.userSub,
    farmId: userAccessRecord.farmId,
    datasetKeys: userAccessRecord.datasetKeys ?? [],
    deviceIds: userAccessRecord.deviceIds ?? null,
    expiresAt: userAccessRecord.expiresAt,
    createdAt: userAccessRecord.createdAt,
    updatedAt: userAccessRecord.updatedAt,
  };

  return result;
};