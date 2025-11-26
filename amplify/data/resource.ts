import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a
  .schema({
    // Models stored in Dynamo
    Farm: a
      .model({
        name: a.string().required(),
        // Cognito sub of the primary farm owner/admin
        ownerSub: a.string().required(),
        description: a.string().required(),
        region: a.string(), // optional by default
      })
      .authorization((allow) => [
        allow.ownerDefinedIn('ownerSub'),
        allow.group('farmAdmin'),
      ]),

    DeviceType: a.enum(['TEMPERATURE', 'MOISTURE']),
    IoTDevice: a
      .model({
        id: a.id().required(),
        type: a.ref('DeviceType').required(), // TEMPERATURE or MOISTURE
        farmId: a.string().required(), // references Farm.id
        devEui: a.string().required(), // unique identifier from the network server
        applicationId: a.string().required(),
        gatewayId: a.string(), // optional: device might talk via different gateways
        // nicer metadata for UI
        name: a.string(), // "North field temp sensor"
        description: a.string(),
        location: a.string(), // "North field, row 3"
        lastSeenAt: a.datetime(), // derived from latest reading
      })
      .authorization((allow) => [
        allow.group('farmAdmin'),
      ]),

    UserAccess: a
      .model({
        userSub: a.string().required(),
        farmId: a.string().required(), //Maybe not needed?
        datasetKeys: a.string().array().required(),
        // Optional: restrict to certain devices only (future-ready)
        deviceIds: a.id().array(),
        expiresAt: a.datetime().required(),   // ISO string for app logic/UI
        ttl: a.integer().required(),     // epoch seconds for Dynamo TTL
        createdBySub: a.string().required(),
      })
      .authorization((allow) => [
        allow.group('farmAdmin'),
      ]),

    // -- Custom Types --
    IoTDeviceView: a.customType({
      id: a.id().required(),
      name: a.string(),
      devEui: a.string().required(),
      type: a.ref('DeviceType').required(),
      lastSeenAt: a.datetime(),
    }),

    TimeSeriesPoint: a.customType({
      timestamp: a.datetime().required(),
      value: a.float().required(),
    }),

    // ---- Lambda Backed Queries ----
    getFarmIotData: a
      .query()
      .arguments({
        farmId: a.string().required(),
        deviceId: a.id().required(),
        datasetKey: a.string().required(), // e.g. "temperature" | "moisture"
        from: a.datetime(),                // optional
        to: a.datetime(),                  // optional
      })
      .returns(
        a.ref("TimeSeriesPoint").array(),
      )
      .authorization((allow) => [
        // Both admins and temp viewers can call this,
        // but the Lambda enforces TempAccessGrant and device visibility.
        allow.group('farmAdmin'),
        allow.group('tempViewer'),
      ])
      ,
      // .handler(a.handler.function(tempUserGetFarmIotDataFn)),
    
    listDevices: a
      .query()
      .arguments({
        farmId: a.string().required(),
      })
      .returns(
        a.ref("IoTDeviceView").array(),
      )
      .authorization((allow) => [
        // Same idea: admins & temps can call it,
        // Lambda decides what each caller actually sees.
        allow.group('farmAdmin'),
        allow.group('tempViewer'),
      ])
      // .handler(a.handler.function(tempUserListDevicesFn));
,
    // ---- Admin Mutations ----
    grantUserAccess: a
      .mutation()
      .arguments({
        farmId: a.string().required(),
        // The email of the user you’re granting access to.
        // Lambda will:
        //  - look up or create the Cognito user
        //  - ensure they’re in tempViewer group (for now)
        userEmail: a.string().required(),
        datasetKeys: a.string().array().required(),
        // Optional: restrict to certain devices
        deviceIds: a.id().array(),
        expiresAt: a.datetime().required(),
      })
      .returns(a.ref('UserAccess'))
      .authorization((allow) => [
        allow.group('farmAdmin'),
      ])
      // .handler(a.handler.function(grantUserAccessFn)),

  })
  // (optional) let specific functions use the Data client with proper auth
  // .authorization((allow) => [
  //   // For example: allow the grantTempUserAccessFn to write TempAccessGrant,
  //   // or iotDataFetcher to read from TempAccessGrant.
  //   allow.resource(grantTempUserAccessFn),
  //   allow.resource(iotDataFetcher),
  // ]);


// 2) Export Schema type for typed clients
export type Schema = ClientSchema<typeof schema>;

// 3) Define the data resource with default auth mode = Cognito userPool
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});


/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any unauthenticated user can "create", "read", "update", 
and "delete" any "Todo" records.
=========================================================================*/
// const schema = a.schema({
//   Todo: a
//     .model({
//       content: a.string(),
//     })
//     .authorization((allow) => [allow.guest()]),
// });

// export type Schema = ClientSchema<typeof schema>;

// export const data = defineData({
//   schema,
//   authorizationModes: {
//     defaultAuthorizationMode: 'identityPool',
//   },
// });

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
