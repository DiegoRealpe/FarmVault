export const handler = async (_event) => {
  return "Hello from my second function!";
};

// import {
//   AthenaClient,
//   StartQueryExecutionCommand,
//   GetQueryExecutionCommand,
//   GetQueryResultsCommand,
//   QueryExecutionState,
// } from '@aws-sdk/client-athena';
// import type { Schema } from "../../data/resource";
// import { Amplify } from "aws-amplify";
// import { generateClient } from "aws-amplify/data";
// import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
// import { env } from "$amplify/env/list-all-devices";

// const athena = new AthenaClient({});
// const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// type AthenaRow = Record<string, string | null>;

// export const handler: Schema["getFarmIotData"]["functionHandler"] = async (event: any) => {
//   console.log('[getIotDeviceData] Event:', JSON.stringify(event));

//   // GraphQL args are typically under event.arguments
//   const deviceIdArg: string | undefined = event?.arguments?.deviceId;
//   if (!deviceIdArg) {
//     throw new Error('deviceId argument is required');
//   }

//   const workGroup = process.env.ATHENA_WORKGROUP ?? 'farmvault-wg';
//   const db = process.env.ATHENA_DATABASE ?? 'iot_telemetry';
//   const table = process.env.ATHENA_TABLE ?? 'iot_parquet';

//   // Basic deviceId filter. We assume deviceIdArg is well-formed; if you
//   // want to be extra safe, you can validate/escape quotes.
//   const safeDeviceId = deviceIdArg.replace(/'/g, "''");

//   const query = `
//     SELECT *
//     FROM "${db}"."${table}"
//     WHERE device_id = '${safeDeviceId}'
//     ORDER BY event_ts
//     LIMIT 1000;
//   `;

//   console.log('[getIotDeviceData] Running Athena query:', query);

//   // 1) Start query
//   const startResp = await athena.send(
//     new StartQueryExecutionCommand({
//       QueryString: query,
//       WorkGroup: workGroup,
//     }),
//   );

//   const queryExecutionId = startResp.QueryExecutionId;
//   if (!queryExecutionId) {
//     throw new Error('Failed to start Athena query: no QueryExecutionId returned');
//   }

//   console.log('[getIotDeviceData] QueryExecutionId:', queryExecutionId);

//   // 2) Poll for completion
//   let state: QueryExecutionState | undefined;
//   let attempts = 0;
//   const maxAttempts = 30;

//   while (attempts < maxAttempts) {
//     attempts += 1;

//     const exec = await athena.send(
//       new GetQueryExecutionCommand({
//         QueryExecutionId: queryExecutionId,
//       }),
//     );

//     state = exec.QueryExecution?.Status?.State as QueryExecutionState | undefined;
//     console.log(`[getIotDeviceData] Attempt ${attempts}, state:`, state);

//     if (state === 'SUCCEEDED') break;
//     if (state === 'FAILED' || state === 'CANCELLED') {
//       const reason = exec.QueryExecution?.Status?.StateChangeReason;
//       throw new Error(`Athena query failed: ${state} - ${reason}`);
//     }

//     await sleep(1000);
//   }

//   if (state !== 'SUCCEEDED') {
//     throw new Error(`Athena query did not complete in time. Last state: ${state}`);
//   }

//   // 3) Fetch results
//   const resultsResp = await athena.send(
//     new GetQueryResultsCommand({
//       QueryExecutionId: queryExecutionId,
//       MaxResults: 1000,
//     }),
//   );

//   const rows = resultsResp.ResultSet?.Rows ?? [];
//   if (rows.length === 0) {
//     return [{
//       deviceId: deviceIdArg,
//       points: [],
//     }];
//   }

//   const headerCells = rows[0].Data ?? [];
//   const columnNames = headerCells.map((cell) => cell.VarCharValue ?? '');

//   const dataRows: AthenaRow[] = rows.slice(1).map((row) => {
//     const obj: AthenaRow = {};
//     row.Data?.forEach((cell, idx) => {
//       obj[columnNames[idx]] = cell.VarCharValue ?? null;
//     });
//     return obj;
//   });

//   console.log('[getIotDeviceData] Raw rows:', JSON.stringify(dataRows, null, 2));

//   // Build time-series points from moisture + timestamp for this device
//   const points = dataRows
//     .filter((r) => r['timestamp'] != null && r['moisture'] != null)
//     .map((r) => ({
//       timestamp: r['timestamp'] as string,           // ISO8601 string
//       value: parseFloat(r['moisture'] as string),    // moisture -> float
//     }));

//   console.log(
//     '[getIotDeviceData] Returning deviceId',
//     deviceIdArg,
//     'with',
//     points.length,
//     'points',
//   );

//   // Matches DeviceTimeSeries type
//   return [{
//     deviceId: deviceIdArg,
//     points,
//   }];
// };
