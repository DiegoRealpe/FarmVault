import type { Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/list-visible-farms";

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

const DEV_BYPASS = false;

type ListVisibleFarmsHandler =
  Schema["listVisibleFarms"]["functionHandler"];
type GrantRecord = Schema["GrantRecord"]["type"];
type MyGrantRecord = Schema["MyGrantRecord"]["type"];
type Farm = Schema["Farm"]["type"];
type Identity = Parameters<ListVisibleFarmsHandler>[0]["identity"];

const MOCK_FARM: Farm = {
  id: "mock-farm",
  name: "Mock Farm",
  ownerSub: "mock-owner-sub",
  description: "Returned by DEV_BYPASS in listVisibleFarmsFn.",
  region: "Unknown",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

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
      (group): group is string => typeof group === "string",
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
        (group): group is string => typeof group === "string",
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

function isExpired(expiresAt?: string | null): boolean {
  if (!expiresAt) {
    return true;
  }

  return new Date(expiresAt).getTime() <= Date.now();
}

function getGrantIdsByType(
  givenGrantRecord: GrantRecord | MyGrantRecord | null,
  grantType: "farm" | "device",
): string[] {
  if (!givenGrantRecord) {
    return [];
  }

  return (givenGrantRecord.grants ?? [])
    .filter((grant) => grant?.grantType === grantType)
    .flatMap((grant) =>
      (grant?.ids ?? []).filter(
        (id): id is string => typeof id === "string" && id.length > 0,
      ),
    );
}

export const handler: ListVisibleFarmsHandler = async (event) => {
  if (DEV_BYPASS) {
    return [MOCK_FARM];
  }

  const callerSub = getCallerSub(event.identity);
  if (!callerSub) {
    throw new Error("This endpoint requires Cognito userPool auth.");
  }

  const callerGroups = getCallerGroups(event.identity);
  const callerIsAdmin = callerGroups.includes("admin");

  if (callerIsAdmin) {
    const { data, errors } = await client.models.Farm.list();

    if (errors?.length) {
      throw new Error(errors.map((error) => error.message).join("; "));
    }

    return (data ?? []).filter((farm) => farm != null);
  }

  const grantRecordResponse = await client.models.GrantRecord.get({
    userSub: callerSub,
  });

  if (grantRecordResponse.errors?.length) {
    throw new Error(
      grantRecordResponse.errors.map((error) => error.message).join("; "),
    );
  }

  const grantRecord = grantRecordResponse.data;

  if (!grantRecord) {
    return [];
  }

  if (isExpired(grantRecord.expiresAt)) {
    return [];
  }

  const visibleFarmIds = new Set(getGrantIdsByType(grantRecord, "farm"));
  const grantedDeviceIds = getGrantIdsByType(grantRecord, "device");

  if (grantedDeviceIds.length > 0) {
    const deviceResponses = await Promise.all(
      grantedDeviceIds.map((deviceId) =>
        client.models.IoTDevice.get({ id: deviceId }),
      ),
    );

    const deviceErrors = deviceResponses.flatMap(
      (response) => response.errors ?? [],
    );

    if (deviceErrors.length) {
      throw new Error(deviceErrors.map((error) => error.message).join("; "));
    }

    const grantedDevices = deviceResponses
      .map((response) => response.data)
      .filter((device) => device != null);

    for (const device of grantedDevices) {
      if (device.farmId) {
        visibleFarmIds.add(device.farmId);
      }
    }
  }

  if (visibleFarmIds.size === 0) {
    return [];
  }

  const { data: allFarms, errors: farmListErrors } =
    await client.models.Farm.list();

  if (farmListErrors?.length) {
    throw new Error(farmListErrors.map((error) => error.message).join("; "));
  }

  return (allFarms ?? [])
    .filter((farm) => farm != null)
    .filter((farm) => visibleFarmIds.has(farm.id));
};