// amplify/functions/list-visible-devices/handler.ts
import { env } from "$amplify/env/list-visible-devices";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";

import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";

import type { Schema } from "../../data/resource";

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

const DEV_BYPASS = false;

type ListVisibleDevicesHandler =
  Schema["listVisibleDevices"]["functionHandler"];
type GrantRecord = Schema["GrantRecord"]["type"];
type MyGrantRecord = Schema["MyGrantRecord"]["type"];
type IoTDevice = Schema["IoTDevice"]["type"];
type Identity = Parameters<ListVisibleDevicesHandler>[0]["identity"];

const MOCK_DEVICE: IoTDevice = {
  id: "mock-device",
  type: "TEMPERATURE",
  farmId: "mock-farm",
  devEui: "0000000000000000",
  applicationId: "mock-app",
  gatewayId: null,
  name: "Mock Device",
  description: "Returned by DEV_BYPASS in listVisibleDevicesFn.",
  location: "Unknown",
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

function isExpired(expiresAt?: string | null): boolean {
  if (!expiresAt) {
    return false;
  }

  return new Date(expiresAt).getTime() <= Date.now();
}

function getGrantIdsByType(
  givenGrantRecord: GrantRecord | MyGrantRecord | null,
  grantType: "farm" | "device"
): string[] {
  if (!givenGrantRecord) {
    return [];
  }

  return (givenGrantRecord.grants ?? [])
    .filter((grant) => grant?.grantType === grantType)
    .flatMap((grant) =>
      (grant?.ids ?? []).filter(
        (id): id is string => typeof id === "string" && id.length > 0
      )
    );
}

export const handler: ListVisibleDevicesHandler = async (event) => {
  if (DEV_BYPASS) {
    return [MOCK_DEVICE];
  }

  const callerSub = getCallerSub(event.identity);

  if (!callerSub) {
    throw new Error("This endpoint requires Cognito userPool auth.");
  }

  const callerGroups = getCallerGroups(event.identity);
  const callerIsAdmin = callerGroups.includes("admin");

  if (callerIsAdmin) {
    const { data, errors } = await client.models.IoTDevice.list();

    if (errors?.length) {
      throw new Error(
        errors.map((error) => error.message).join("; ")
      );
    }

    return (data ?? []).filter((device): any => device != null);
  }

  const grantRecordResponse = await client.models.GrantRecord.get({
    userSub: callerSub,
  });

  if (grantRecordResponse.errors?.length) {
    throw new Error(
      grantRecordResponse.errors
        .map((error) => error.message)
        .join("; ")
    );
  }

  const grantRecord = grantRecordResponse.data;

  if (!grantRecord) {
    return [];
  }

  if (isExpired(grantRecord.expiresAt)) {
    return [];
  }

  const allowedFarmIds = new Set(
    getGrantIdsByType(grantRecord, "farm")
  );
  const allowedDeviceIds = new Set(
    getGrantIdsByType(grantRecord, "device")
  );

  if (allowedFarmIds.size === 0 && allowedDeviceIds.size === 0) {
    return [];
  }

  const { data: allDevices, errors: deviceListErrors } =
    await client.models.IoTDevice.list();

  if (deviceListErrors?.length) {
    throw new Error(
      deviceListErrors.map((error) => error.message).join("; ")
    );
  }

  const visibleDevices = (allDevices ?? [])
    .filter((device): any => device != null)
    .filter(
      (device) =>
        allowedDeviceIds.has(device.id) ||
        allowedFarmIds.has(device.farmId)
    );

  return visibleDevices;
};
