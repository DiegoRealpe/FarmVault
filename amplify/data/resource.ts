import { a, defineData, type ClientSchema } from "@aws-amplify/backend";
import { listAllDevicesFn } from "../functions/list-all-devices/resource";
import { getFarmIotDataFn } from "../functions/get-farm-iot-data/resource";

const schema = a
  .schema({
    // Models stored in Dynamo
    Todo: a
      .model({
        content: a.string(),
      })
      .authorization((allow) => [allow.publicApiKey()]),

    Farm: a
      .model({
        name: a.string().required(),
        // Cognito sub of the primary farm owner/admin
        ownerSub: a.string().required(),
        description: a.string().required(),
        region: a.string(), // optional by default
        createdAt: a.datetime().required(),
        updatedAt: a.datetime().required(),
      })
      .authorization((allow) => [
        allow.publicApiKey(),
        // allow.group('farmAdmin'),
      ]),

    DeviceType: a.enum(["TEMPERATURE", "MOISTURE"]),
    IoTDevice: a
      .model({
        id: a.string().required(),
        type: a.ref("DeviceType").required(), // TEMPERATURE or MOISTURE
        farmId: a.string().required(), // references Farm.id
        devEui: a.string().required(), // unique identifier from the network server
        applicationId: a.string().required(),
        gatewayId: a.string(), // optional: device might talk via different gateways
        // nicer metadata for UI
        name: a.string(), // "North field temp sensor"
        description: a.string(),
        location: a.string(), // "North field, row 3"
        createdAt: a.datetime().required(),
        updatedAt: a.datetime().required(),
      })
      .authorization((allow) => [
        allow.publicApiKey(),
        // allow.group('farmAdmin'),
      ]),

    UserAccess: a
      .model({
        userSub: a.string().required(),
        farmId: a.string().required(), //Maybe not needed?
        datasetKeys: a.string().array().required(),
        // Optional: restrict to certain devices only (future-ready)
        deviceIds: a.string().array(),
        expiresAt: a.datetime().required(), // ISO string for app logic/UI
        ttl: a.integer().required(), // epoch seconds for Dynamo TTL
        createdBySub: a.string().required(),
        createdAt: a.datetime().required(),
        updatedAt: a.datetime().required(),
      })
      .authorization((allow) => [
        allow.publicApiKey(),
        // allow.group('farmAdmin'),
      ]),

    // -- Custom Types --
    IoTDeviceView: a.customType({
      id: a.string().required(),
      name: a.string(),
      devEui: a.string().required(),
      type: a.ref("DeviceType").required(),
      farmId: a.string().required(), // references Farm.id
      applicationId: a.string().required(),
      gatewayId: a.string(), // optional: device might talk via different gateways
      description: a.string(),
      location: a.string(), // "North field, row 3"
      createdAt: a.datetime().required(),
      updatedAt: a.datetime().required(),
    }),

    TimeSeriesPoint: a.customType({
      timestamp: a.datetime().required(),
      value: a.float().required(),
    }),

    DeviceTimeSeries: a.customType({
      deviceId: a.string().required(),
      points: a.ref("TimeSeriesPoint").array(),
    }),

    // ---- Lambda Backed Queries ----
    getFarmIotData: a
      .query()
      .arguments({
        // farmId: a.string().required(),
        deviceId: a.string().required(),
        // datasetKey: a.string().required(), // e.g. "temperature" | "moisture"
        // from: a.datetime(),                // optional
        // to: a.datetime(),                  // optional
      })
      .returns(a.ref("DeviceTimeSeries").array())
      .authorization((allow) => [
        // Both admins and temp viewers can call this,
        // but the Lambda enforces TempAccessGrant and device visibility.
        allow.publicApiKey(),
        // allow.group('farmAdmin'),
        // allow.group('tempViewer'),
      ])
      .handler(a.handler.function(getFarmIotDataFn)),

    listAllDevices: a
      .query()
      .arguments({
        farmId: a.string().required(),
      })
      .returns(a.ref("IoTDeviceView").array().required())
      .authorization((allow) => [
        // Same idea: admins & temps can call it,
        // Lambda decides what each caller actually sees.
        // allow.group('farmAdmin'),
        // allow.group('tempViewer'),
        allow.publicApiKey(),
      ])
      .handler(a.handler.function(listAllDevicesFn)),

    // ---- Admin Mutations ----
    // grantUserAccess: a
    //   .mutation()
    //   .arguments({
    //     farmId: a.string().required(),
    //     // The email of the user you’re granting access to.
    //     // Lambda will:
    //     //  - look up or create the Cognito user
    //     //  - ensure they’re in tempViewer group (for now)
    //     userEmail: a.string().required(),
    //     datasetKeys: a.string().array().required(),
    //     // Optional: restrict to certain devices
    //     deviceIds: a.string().array(),
    //     expiresAt: a.datetime().required(),
    //   })
    //   .returns(a.ref('UserAccess'))
    //   .authorization((allow) => [
    // allow.group('farmAdmin'),
    //   ])
    // .handler(a.handler.function(grantUserAccessFn)),
  })
  // (optional) let specific functions use the Data client with proper auth
  .authorization((allow) => [
    // For example: allow the grantTempUserAccessFn to write TempAccessGrant,
    // or iotDataFetcher to read from TempAccessGrant.
    allow.resource(listAllDevicesFn),
    allow.resource(getFarmIotDataFn),
  ]);

// 2) Export Schema type for typed clients
export type Schema = ClientSchema<typeof schema>;

// 3) Define the data resource with default auth mode = Cognito userPool
// export const data = defineData({
//   schema,
//   authorizationModes: {
//     defaultAuthorizationMode: 'userPool',
//   },
// });
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    // API Key is used for a.allow.public() rules
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
