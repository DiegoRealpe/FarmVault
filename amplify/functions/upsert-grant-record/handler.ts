// amplify/functions/upsert-grant-record/handler.ts
import { env } from "$amplify/env/upsert-grant-record";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";

import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";

import type { Schema } from "../../data/resource";

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

type UpsertGrantRecordHandler =
  Schema["upsertGrantRecord"]["functionHandler"];
type Identity = Parameters<UpsertGrantRecordHandler>[0]["identity"];
type UpsertGrantRecordArguments =
  Parameters<UpsertGrantRecordHandler>[0]["arguments"];
type GrantRecord = Schema["GrantRecord"]["type"];
type UpsertGrantRecordResult =
  Schema["UpsertGrantRecordResult"]["type"];

function getCallerSub(identity: Identity): string | null {
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

function getCallerGroups(identity: Identity): string[] {
  if (!identity) {
    return [];
  }

  if ("groups" in identity && Array.isArray(identity.groups)) {
    return identity.groups.filter(
      (group): group is string => typeof group === "string"
    );
  }

  if (
    "claims" in identity &&
    identity.claims &&
    typeof identity.claims === "object" &&
    "cognito:groups" in identity.claims
  ) {
    const rawGroups = identity.claims["cognito:groups"];

    if (Array.isArray(rawGroups)) {
      return rawGroups.filter(
        (group): group is string => typeof group === "string"
      );
    }

    if (typeof rawGroups === "string") {
      return rawGroups
        .split(",")
        .map((group) => group.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function isAdmin(identity: Identity): boolean {
  return getCallerGroups(identity).includes("admin");
}

function toEpochSeconds(isoDateTime: string): number {
  const ms = new Date(isoDateTime).getTime();

  if (Number.isNaN(ms)) {
    throw new Error(`Invalid expiresAt value: ${isoDateTime}`);
  }

  return Math.floor(ms / 1000);
}

function sanitizeGrants(
  givenGrants: UpsertGrantRecordArguments["grants"]
): Array<{ grantType: "farm" | "device"; ids: string[] }> {
  return (givenGrants ?? [])
    .filter((grant) => grant != null)
    .map((grant) => ({
      grantType: grant.grantType,
      ids: (grant.ids ?? [])
        .filter((id): id is string => typeof id === "string")
        .map((id) => id.trim())
        .filter(Boolean),
    }))
    .filter((grant) => grant.ids.length > 0);
}

function toResult(
  givenGrantRecord: GrantRecord
): UpsertGrantRecordResult {
  return {
    userSub: givenGrantRecord.userSub,
    email: givenGrantRecord.email,
    username: givenGrantRecord.username,
    grants: givenGrantRecord.grants ?? [],
    expiresAt: givenGrantRecord.expiresAt,
    createdAt: givenGrantRecord.createdAt,
    updatedAt: givenGrantRecord.updatedAt,
  };
}

export const handler: UpsertGrantRecordHandler = async (event) => {
  console.log(
    "upsertGrantRecord event:",
    JSON.stringify(event, null, 2)
  );

  if (!isAdmin(event.identity)) {
    throw new Error("Only admins can upsert grant records.");
  }

  const adminSub = getCallerSub(event.identity);
  if (!adminSub) {
    throw new Error("This endpoint requires Cognito userPool auth.");
  }

  const { userSub, email, username, grants, expiresAt } =
    event.arguments;

  if (!userSub?.trim()) {
    throw new Error("userSub is required.");
  }

  if (!email?.trim()) {
    throw new Error("email is required.");
  }

  if (!expiresAt) {
    throw new Error("expiresAt is required.");
  }

  const sanitizedUserSub = userSub.trim();
  const sanitizedEmail = email.trim();
  const sanitizedUsername = username?.trim() || undefined;
  const sanitizedGrants = sanitizeGrants(grants);
  const ttl = toEpochSeconds(expiresAt);
  const now = new Date().toISOString();

  const existingResponse = await client.models.GrantRecord.get({
    userSub: sanitizedUserSub,
  });

  if (existingResponse.errors?.length) {
    throw new Error(
      existingResponse.errors.map((error) => error.message).join("; ")
    );
  }

  const existingGrantRecord = existingResponse.data;

  if (existingGrantRecord) {
    const updateResponse = await client.models.GrantRecord.update({
      userSub: sanitizedUserSub,
      email: sanitizedEmail,
      username: sanitizedUsername,
      grants: sanitizedGrants,
      expiresAt,
      ttl,
      createdBySub: adminSub,
      createdAt: existingGrantRecord.createdAt,
      updatedAt: now,
    });

    if (updateResponse.errors?.length) {
      throw new Error(
        updateResponse.errors.map((error) => error.message).join("; ")
      );
    }

    if (!updateResponse.data) {
      throw new Error("GrantRecord update returned no data.");
    }

    return toResult(updateResponse.data);
  }

  const createResponse = await client.models.GrantRecord.create({
    userSub: sanitizedUserSub,
    email: sanitizedEmail,
    username: sanitizedUsername,
    grants: sanitizedGrants,
    expiresAt,
    ttl,
    createdBySub: adminSub,
    createdAt: now,
    updatedAt: now,
  });

  if (createResponse.errors?.length) {
    throw new Error(
      createResponse.errors.map((error) => error.message).join("; ")
    );
  }

  if (!createResponse.data) {
    throw new Error("GrantRecord create returned no data.");
  }

  return toResult(createResponse.data);
};
