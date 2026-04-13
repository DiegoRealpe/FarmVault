import type { Schema } from "../../data/resource";

import { Amplify } from "aws-amplify";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/list-all-devices";

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);

type ListAllDevicesHandler =
  Schema["listAllDevices"]["functionHandler"];

export const handler: ListAllDevicesHandler = async (event) => {
  console.log("listAllDevices event:", JSON.stringify(event, null, 2));

  throw new Error("listAllDevicesFn not implemented yet.");
};

// // amplify/functions/list-all-devices/handler.ts
// import type { Schema } from "../../data/resource";
// import { Amplify } from "aws-amplify";
// import { generateClient } from "aws-amplify/data";
// import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
// import { env } from "$amplify/env/list-all-devices";

// const { resourceConfig, libraryOptions } =
//   await getAmplifyDataClientConfig(env);
// Amplify.configure(resourceConfig, libraryOptions);

// const client = generateClient<Schema>();

// const DEV_BYPASS = false;

// type ListAllDevicesHandler = Schema["listAllDevices"]["functionHandler"];
// type IoTDeviceView = Schema["IoTDeviceView"]["type"];

// const MOCK_DEVICE_VIEW: IoTDeviceView = {
//   id: "mock-device",
//   type: "TEMPERATURE",
//   farmId: "mock-farm",
//   devEui: "0000000000000000",
//   applicationId: "mock-app",
//   gatewayId: null,
//   name: "Mock Device",
//   description: "Returned by DEV_BYPASS in listAllDevicesFn.",
//   location: "Unknown",
//   createdAt: "2026-01-01T00:00:00.000Z",
//   updatedAt: "2026-01-01T00:00:00.000Z",
// };

// type Identity = Parameters<ListAllDevicesHandler>[0]["identity"];
// type UserAccess = Schema["UserAccess"]["type"];
// type IoTDeviceRecord = NonNullable<
//   Awaited<ReturnType<typeof client.models.IoTDevice.get>>["data"]
// >;

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

// function getCallerGroups(identity: Identity): string[] {
//   if (!identity) {
//     return [];
//   }

//   if ("groups" in identity && Array.isArray(identity.groups)) {
//     return identity.groups.filter(
//       (group): group is string => typeof group === "string",
//     );
//   }

//   if (
//     "claims" in identity &&
//     identity.claims &&
//     typeof identity.claims === "object" &&
//     "cognito:groups" in identity.claims
//   ) {
//     const rawGroups = identity.claims["cognito:groups"];

//     if (Array.isArray(rawGroups)) {
//       return rawGroups.filter(
//         (group): group is string => typeof group === "string",
//       );
//     }

//     if (typeof rawGroups === "string") {
//       return rawGroups
//         .split(",")
//         .map((group) => group.trim())
//         .filter(Boolean);
//     }
//   }

//   return [];
// }

// function isExpired(expiresAt: string): boolean {
//   return new Date(expiresAt).getTime() <= Date.now();
// }

// function toDeviceView(device: IoTDeviceRecord): IoTDeviceView {
//   return {
//     id: device.id,
//     type: device.type,
//     farmId: device.farmId,
//     devEui: device.devEui,
//     applicationId: device.applicationId,
//     gatewayId: device.gatewayId ?? null,
//     name: device.name ?? null,
//     description: device.description ?? null,
//     location: device.location ?? null,
//     createdAt: device.createdAt,
//     updatedAt: device.updatedAt,
//   };
// }

// export const handler: ListAllDevicesHandler = async (event) => {
//   if (DEV_BYPASS) {
//     return [MOCK_DEVICE_VIEW];
//   }

//   // Authentication retrieval
//   const callerSub = getCallerSub(event.identity);
//   if (!callerSub) {
//     throw new Error("This endpoint requires Cognito userPool auth.");
//   }

//   const callerGroups = getCallerGroups(event.identity);
//   const callerIsAdmin = callerGroups.includes("admin");

//   // Admin behavior, return all
//   if (callerIsAdmin) {
//     const { data, errors } = await client.models.IoTDevice.list();

//     if (errors?.length) {
//       throw new Error(errors.map((error) => error.message).join("; "));
//     }

//     const devices = (data ?? []).filter((device) => device != null);

//     return devices.map(toDeviceView);
//   }

//   const userAccessResponse = await client.models.UserAccess.get({
//     userSub: callerSub,
//   });

//   if (userAccessResponse.errors?.length) {
//     throw new Error(
//       userAccessResponse.errors.map((error) => error.message).join("; "),
//     );
//   }

//   const userAccessRecord: UserAccess | null | undefined = userAccessResponse.data;

//   if (userAccessRecord == null) {
//     return [];
//   }

//   if (isExpired(userAccessRecord.expiresAt)) {
//     return [];
//   }

//   const allowedDeviceIds = (userAccessRecord.deviceIds ?? []).filter(
//     (deviceId): deviceId is string =>
//       typeof deviceId === "string" && deviceId.length > 0,
//   );

//   if (allowedDeviceIds.length > 0) {
//     const allDeviceResponses = await Promise.all(
//       allowedDeviceIds.map((deviceId) =>
//         client.models.IoTDevice.get({ id: deviceId }),
//       ),
//     );

//     const responseErrors = allDeviceResponses.flatMap(
//       (response) => response.errors ?? [],
//     );

//     if (responseErrors.length) {
//       throw new Error(responseErrors.map((error) => error.message).join("; "));
//     }

//     const visibleDevices = allDeviceResponses
//       .map((response) => response.data)
//       .filter((device) => device != null)
//       .filter((device) => device.farmId === userAccessRecord.farmId);

//     return visibleDevices.map(toDeviceView);
//   }

//   const farmDevicesResponse = await client.models.IoTDevice.list({
//     filter: {
//       farmId: { eq: userAccessRecord.farmId },
//     },
//   });

//   if (farmDevicesResponse.errors?.length) {
//     throw new Error(
//       farmDevicesResponse.errors.map((error) => error.message).join("; "),
//     );
//   }

//   const visibleDevices = (farmDevicesResponse.data ?? []).filter(
//     (device) => device != null,
//   );

//   return visibleDevices.map(toDeviceView);
// };