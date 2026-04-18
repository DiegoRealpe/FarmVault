import { a, defineData, type ClientSchema } from "@aws-amplify/backend";
import { listVisibleDevicesFn } from "../functions/list-visible-devices/resource";
import { getFarmIotDataFn } from "../functions/get-farm-iot-data/resource";
import { createFarmUserFn } from "../functions/create-farm-user/resource";
import { getPersonalGrantRecordFn } from "../functions/get-personal-grant-record/resource";
import { listCreatedGrantRecordsFn } from "../functions/list-created-grant-records/resource";
import { upsertGrantRecordFn } from "../functions/upsert-grant-record/resource";
import { listVisibleFarmsFn } from "../functions/list-visible-farms/resource";


const schema = a
  .schema({
    // TODO: Remove 
    Todo: a
      .model({
        content: a.string(),
      })
      .authorization((allow) => [allow.authenticated()]),

    Farm: a
      .model({
        id: a.string().required(),
        name: a.string().required(),
        ownerSub: a.string().required(),
        description: a.string().required(),
        region: a.string(),
        createdAt: a.datetime().required(),
        updatedAt: a.datetime().required(),
      })
      .identifier(["id"])
      // TODO: Remove 
      .authorization((allow) => [
        allow.authenticated(),
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
      // TODO: Remove 
      .authorization((allow) => [
        allow.authenticated(),
        // allow.group('farmAdmin'),
      ]),

    
    GrantRecord: a
      .model({
        userSub: a.string().required(),
        grants: a.ref("GrantEntry").array().required(),
        expiresAt: a.datetime().required(),
        ttl: a.integer().required(),
        createdBySub: a.string().required(),
        createdAt: a.datetime().required(),
        updatedAt: a.datetime().required(),
      })
      .identifier(["userSub"])
      // TODO: remove direct client access later
      .authorization((allow) => [
        allow.authenticated(),
        // allow.group("admin").to(["read"]),
        // allow.ownerDefinedIn("userSub").to(["read"]),
      ]),

    // -- Custom Types --
    TimeSeriesPoint: a.customType({
      timestamp: a.datetime().required(),
      value: a.float().required(),
    }),
    
    GrantType: a.enum(["farm", "device"]),

    GrantEntry: a.customType({
      grantType: a.ref("GrantType").required(),
      ids: a.string().array().required(),
    }),

    MyGrantRecord: a.customType({
      userSub: a.string().required(),
      grants: a.ref("GrantEntry").array().required(),
      expiresAt: a.datetime().required(),
      createdAt: a.datetime().required(),
      updatedAt: a.datetime().required(),
    }),

    CreateFarmUserResult: a.customType({
      success: a.boolean().required(),
      username: a.string().required(),
      userSub: a.string(),
      assignedGroup: a.string().required(),
    }),

    UpsertGrantRecordResult: a.customType({
      userSub: a.string().required(),
      grants: a.ref("GrantEntry").array().required(),
      expiresAt: a.datetime().required(),
      createdAt: a.datetime().required(),
      updatedAt: a.datetime().required(),
    }),
    
    DeviceTimeSeries: a.customType({
      deviceId: a.string().required(),
      points: a.ref("TimeSeriesPoint").array(),
    }),

    //// ---- Lambda Backed Queries ----
    // ---- User Agnostic Queries ----
    getFarmIotData: a
      .query()
      .arguments({
        deviceId: a.string().required(),
        from: a.datetime(),                // optional
        to: a.datetime(),                  // optional
      })
      .returns(a.ref("DeviceTimeSeries").array())
      .authorization((allow) => [
        // Both admins and temp viewers can call this,
        // but the Lambda enforces TempAccessGrant and device visibility.
        allow.authenticated(),
      ])
      .handler(a.handler.function(getFarmIotDataFn)),

    listVisibleFarms: a
      .query()
      .returns(a.ref("Farm").array().required())
      .authorization((allow) => [
        allow.authenticated(),
      ])
      .handler(a.handler.function(listVisibleFarmsFn)),

    listVisibleDevices: a
      .query()
      .returns(a.ref("IoTDevice").array().required())
      .authorization((allow) => [
        allow.authenticated(),
      ])
      .handler(a.handler.function(listVisibleDevicesFn)),

    // ---- User Specific Queries ----
    getPersonalGrantRecord: a
      .query()
      .returns(a.ref("MyGrantRecord"))
      .authorization((allow) => [allow.authenticated()])
      // .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(getPersonalGrantRecordFn)),

    // ---- Admin Specific Queries ----
    listCreatedGrantRecords: a
      .query()
      .returns(a.ref("GrantRecord").array().required())
      // .authorization((allow) => [allow.group("admin")])
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(listCreatedGrantRecordsFn)),

    // ---- Admin Mutations ----
    createFarmUser: a
      .mutation()
      .arguments({
        email: a.string().required(),
        temporaryPassword: a.string().required(),
      })
      .returns(a.ref("CreateFarmUserResult").required())
      // .authorization((allow) => [allow.group("admin")])
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(createFarmUserFn)),

    upsertGrantRecord: a
      .mutation()
      .arguments({
        userSub: a.string().required(),
        grants: a.ref("GrantEntry").array().required(),
        expiresAt: a.datetime().required(),
      })
      .returns(a.ref("UpsertGrantRecordResult").required())
      // .authorization((allow) => [allow.group("admin")])
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(upsertGrantRecordFn)),
  })
  // (optional) let specific functions use the Data client with proper auth
  .authorization((allow) => [
    allow.resource(listCreatedGrantRecordsFn),
    allow.resource(listVisibleDevicesFn),
    allow.resource(listVisibleFarmsFn),
    allow.resource(getFarmIotDataFn),
    allow.resource(getPersonalGrantRecordFn),
    allow.resource(upsertGrantRecordFn)
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
