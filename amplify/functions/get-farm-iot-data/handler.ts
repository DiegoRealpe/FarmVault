import { env } from "$amplify/env/get-farm-iot-data";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";

import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";

import {
  AthenaClient,
  GetQueryExecutionCommand,
  GetQueryResultsCommand,
  QueryExecutionState,
  StartQueryExecutionCommand,
} from "@aws-sdk/client-athena";

import type { Schema } from "../../data/resource";

const athena = new AthenaClient({});
const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

type GetFarmIotDataHandler =
  Schema["getFarmIotData"]["functionHandler"];
type Identity = Parameters<GetFarmIotDataHandler>[0]["identity"];
type GrantRecord = Schema["GrantRecord"]["type"];
type MyGrantRecord = Schema["MyGrantRecord"]["type"];
type IoTDevice = Schema["IoTDevice"]["type"];
type AthenaRow = Record<string, string | null>;

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function getClaim(identity: Identity, claimName: string): unknown {
  if (!identity || typeof identity !== "object") return null;

  if (claimName in identity) {
    return identity[claimName as keyof typeof identity];
  }

  if (
    "claims" in identity &&
    identity.claims &&
    typeof identity.claims === "object" &&
    claimName in identity.claims
  ) {
    return identity.claims[claimName as keyof typeof identity.claims];
  }

  return null;
}

function getCallerSub(identity: Identity): string | null {
  const sub = getClaim(identity, "sub");
  return typeof sub === "string" ? sub : null;
}

function getGroups(identity: Identity): string[] {
  const groups =
    getClaim(identity, "groups") ??
    getClaim(identity, "cognito:groups");

  if (Array.isArray(groups)) {
    return groups.filter(
      (group): group is string => typeof group === "string"
    );
  }

  if (typeof groups === "string") {
    return groups
      .split(",")
      .map((group) => group.trim())
      .filter(Boolean);
  }

  return [];
}

function isAdmin(identity: Identity): boolean {
  return getGroups(identity).some(
    (group) => group.toLowerCase() === "admin"
  );
}

function isGrantActive(
  grantRecord: GrantRecord | MyGrantRecord | null | undefined
): boolean {
  if (!grantRecord) return false;

  const now = Date.now();

  if ("ttl" in grantRecord && typeof grantRecord.ttl === "number") {
    return grantRecord.ttl > Math.floor(now / 1000);
  }

  return (
    typeof grantRecord.expiresAt === "string" &&
    new Date(grantRecord.expiresAt).getTime() > now
  );
}

function userHasDeviceAccess(
  grantRecord: GrantRecord | MyGrantRecord,
  device: IoTDevice
): boolean {
  return (grantRecord.grants ?? []).some((entry) => {
    if (!entry) return false;

    const ids = (entry.ids ?? []).filter(
      (id): id is string => typeof id === "string"
    );

    return (
      (entry.grantType === "device" && ids.includes(device.id)) ||
      (entry.grantType === "farm" && ids.includes(device.farmId))
    );
  });
}

function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

function toAthenaTimestampLiteral(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid timestamp argument: ${value}`);
  }

  return parsed.toISOString().replace("T", " ").replace("Z", "");
}

function buildTimestampClause(
  operator: ">=" | "<=",
  value?: string | null
): string {
  if (!value) return "";

  return `AND "timestamp" ${operator} TIMESTAMP '${toAthenaTimestampLiteral(
    value
  )}'`;
}

function getMetricType(device: IoTDevice): "TEMP" | "MOISTURE" {
  return device.type === "TEMPERATURE" ? "TEMP" : "MOISTURE";
}

async function getDevice(deviceId: string): Promise<IoTDevice> {
  const { data, errors } = await client.models.IoTDevice.get({
    id: deviceId,
  });

  if (errors?.length) {
    throw new Error(
      `Failed to load device: ${errors.map((error) => error.message).join("; ")}`
    );
  }

  if (!data) {
    throw new Error("Requested device does not exist.");
  }

  return data;
}

async function assertAuthorized(
  identity: Identity,
  callerSub: string,
  device: IoTDevice
): Promise<void> {
  if (isAdmin(identity)) return;

  const { data: grantRecord, errors } =
    await client.models.GrantRecord.get({
      userSub: callerSub,
    });

  if (errors?.length) {
    throw new Error(
      `Failed to load grant record: ${errors
        .map((error) => error.message)
        .join("; ")}`
    );
  }

  if (
    !grantRecord ||
    !isGrantActive(grantRecord) ||
    !userHasDeviceAccess(grantRecord, device)
  ) {
    throw new Error("Not authorized.");
  }
}

async function runAthenaQuery(
  query: string,
  workGroup: string
): Promise<AthenaRow[]> {
  const startResp = await athena.send(
    new StartQueryExecutionCommand({
      QueryString: query,
      WorkGroup: workGroup,
    })
  );

  const queryExecutionId = startResp.QueryExecutionId;

  if (!queryExecutionId) {
    throw new Error(
      "Failed to start Athena query: no QueryExecutionId returned."
    );
  }

  for (let attempt = 1; attempt <= 30; attempt += 1) {
    const exec = await athena.send(
      new GetQueryExecutionCommand({
        QueryExecutionId: queryExecutionId,
      })
    );

    const state = exec.QueryExecution?.Status?.State as
      | QueryExecutionState
      | undefined;

    console.log(`[getFarmIotData] Attempt ${attempt}, state:`, state);

    if (state === "SUCCEEDED") break;

    if (state === "FAILED" || state === "CANCELLED") {
      const reason = exec.QueryExecution?.Status?.StateChangeReason;
      throw new Error(`Athena query failed: ${state} - ${reason}`);
    }

    if (attempt === 30) {
      throw new Error(
        `Athena query did not complete in time. Last state: ${state}`
      );
    }

    await sleep(1000);
  }

  const resultsResp = await athena.send(
    new GetQueryResultsCommand({
      QueryExecutionId: queryExecutionId,
      MaxResults: 1000,
    })
  );

  const rows = resultsResp.ResultSet?.Rows ?? [];
  if (rows.length === 0) return [];

  const columnNames = (rows[0].Data ?? []).map(
    (cell) => cell.VarCharValue ?? ""
  );

  return rows.slice(1).map((row) => {
    const obj: AthenaRow = {};

    row.Data?.forEach((cell, index) => {
      obj[columnNames[index]] = cell.VarCharValue ?? null;
    });

    return obj;
  });
}

function toAwsDateTime(value: string): string {
  if (value.includes("T")) return value;
  return `${value.replace(" ", "T")}Z`;
}

export const handler: GetFarmIotDataHandler = async (event) => {
  console.log(
    "[getFarmIotData] Event:",
    JSON.stringify(event, null, 2)
  );

  const callerSub = getCallerSub(event.identity);
  if (!callerSub) {
    throw new Error("This endpoint requires Cognito userPool auth.");
  }

  const deviceId = event.arguments.deviceId;
  if (!deviceId) {
    throw new Error("deviceId argument is required.");
  }

  const device = await getDevice(deviceId);
  await assertAuthorized(event.identity, callerSub, device);

  const workGroup = process.env.ATHENA_WORKGROUP ?? "farmvault-wg";
  const db = process.env.ATHENA_DATABASE ?? "iot_telemetry";
  const table = process.env.ATHENA_TABLE ?? "iot_parquet";
  const metricType = getMetricType(device);

  const query = `
    SELECT
      device_id,
      dev_eui,
      application_id,
      gateway_id,
      metric_type,
      value,
      "timestamp"
    FROM "${db}"."${table}"
    WHERE device_id = '${escapeSqlString(deviceId)}'
      AND metric_type = '${escapeSqlString(metricType)}'
      ${buildTimestampClause(">=", event.arguments.from)}
      ${buildTimestampClause("<=", event.arguments.to)}
    ORDER BY "timestamp"
    LIMIT 1000;
  `;

  console.log("[getFarmIotData] Running Athena query:", query);

  const rows = await runAthenaQuery(query, workGroup);

  const points = rows
    .filter((row) => row.timestamp != null && row.value != null)
    .map((row) => ({
      timestamp: toAwsDateTime(row.timestamp as string),
      value: parseFloat(row.value as string),
      // metricType: row.metric_type ?? metricType,
    }))
    .filter((point) => !Number.isNaN(point.value));

  console.log(
    "[getFarmIotData] Returning deviceId",
    deviceId,
    "with",
    points.length,
    "points"
  );

  return [
    {
      deviceId,
      points,
    },
  ];
};
