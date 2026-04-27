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

type GrantRecord = Schema["GrantRecord"]["type"];
type MyGrantRecord = Schema["MyGrantRecord"]["type"];
type GetFarmIotDataHandler =
  Schema["getFarmIotData"]["functionHandler"];
type Identity = Parameters<GetFarmIotDataHandler>[0]["identity"];
type IoTDevice = Schema["IoTDevice"]["type"];

type AthenaRow = Record<string, string | null>;

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function getCallerSub(identity: Identity): string | null {
  if (!identity || typeof identity !== "object") return null;

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

function getGroups(identity: Identity): string[] {
  if (!identity || typeof identity !== "object") return [];

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
  return getGroups(identity).some(
    (group) => group.toLowerCase() === "admin"
  );
}

function isGrantActive(
  givenGrantRecord: GrantRecord | MyGrantRecord | null | undefined
): boolean {
  if (!givenGrantRecord) return false;

  const now = Date.now();

  if (
    "ttl" in givenGrantRecord &&
    typeof givenGrantRecord.ttl === "number"
  ) {
    return givenGrantRecord.ttl > Math.floor(now / 1000);
  }

  if (typeof givenGrantRecord.expiresAt === "string") {
    return new Date(givenGrantRecord.expiresAt).getTime() > now;
  }

  return false;
}

function userHasDeviceAccess(
  givenGrantRecord: GrantRecord | MyGrantRecord,
  device: IoTDevice
): boolean {
  for (const entry of givenGrantRecord.grants ?? []) {
    if (!entry) continue;

    const ids = (entry.ids ?? []).filter(
      (id): id is string => typeof id === "string"
    );

    if (entry.grantType === "device" && ids.includes(device.id)) {
      return true;
    }

    if (entry.grantType === "farm" && ids.includes(device.farmId)) {
      return true;
    }
  }

  return false;
}

function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

function getMetricType(device: IoTDevice): "TEMP" | "MOISTURE" {
  if (device.type === "TEMPERATURE") {
    return "TEMP";
  }

  return "MOISTURE";
}

function buildTimestampClause(
  columnName: string,
  operator: ">=" | "<=",
  value?: string | null
): string {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid timestamp argument: ${value}`);
  }

  return `AND "${columnName}" ${operator} TIMESTAMP '${escapeSqlString(value)}'`;
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

  const deviceIdArg = event.arguments.deviceId;
  if (!deviceIdArg) {
    throw new Error("deviceId argument is required.");
  }

  const { data: device, errors: deviceErrors } =
    await client.models.IoTDevice.get({ id: deviceIdArg });

  if (deviceErrors?.length) {
    throw new Error(
      `Failed to load device: ${deviceErrors
        .map((error) => error.message)
        .join("; ")}`
    );
  }

  if (!device) {
    throw new Error("Requested device does not exist.");
  }

  if (!isAdmin(event.identity)) {
    const { data: grantRecord, errors: grantErrors } =
      await client.models.GrantRecord.get({
        userSub: callerSub,
      });

    if (grantErrors?.length) {
      throw new Error(
        `Failed to load grant record: ${grantErrors
          .map((error) => error.message)
          .join("; ")}`
      );
    }

    if (!grantRecord || !isGrantActive(grantRecord)) {
      throw new Error("Not authorized.");
    }

    if (!userHasDeviceAccess(grantRecord, device)) {
      throw new Error("Not authorized.");
    }
  }

  const workGroup = process.env.ATHENA_WORKGROUP ?? "farmvault-wg";
  const db = process.env.ATHENA_DATABASE ?? "iot_telemetry";
  const table = process.env.ATHENA_TABLE ?? "iot_parquet";

  const metricType = getMetricType(device);

  const safeDeviceId = escapeSqlString(deviceIdArg);
  const safeMetricType = escapeSqlString(metricType);

  const fromClause = buildTimestampClause(
    "timestamp",
    ">=",
    event.arguments.from
  );

  const toClause = buildTimestampClause(
    "timestamp",
    "<=",
    event.arguments.to
  );

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
    WHERE device_id = '${safeDeviceId}'
      AND metric_type = '${safeMetricType}'
      ${fromClause}
      ${toClause}
    ORDER BY "timestamp"
    LIMIT 1000;
  `;

  console.log("[getFarmIotData] Running Athena query:", query);

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

  let state: QueryExecutionState | undefined;
  let attempts = 0;
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    attempts += 1;

    const exec = await athena.send(
      new GetQueryExecutionCommand({
        QueryExecutionId: queryExecutionId,
      })
    );

    state = exec.QueryExecution?.Status?.State as
      | QueryExecutionState
      | undefined;

    console.log(
      `[getFarmIotData] Attempt ${attempts}, state:`,
      state
    );

    if (state === "SUCCEEDED") break;

    if (state === "FAILED" || state === "CANCELLED") {
      const reason = exec.QueryExecution?.Status?.StateChangeReason;
      throw new Error(`Athena query failed: ${state} - ${reason}`);
    }

    await sleep(1000);
  }

  if (state !== "SUCCEEDED") {
    throw new Error(
      `Athena query did not complete in time. Last state: ${state}`
    );
  }

  const resultsResp = await athena.send(
    new GetQueryResultsCommand({
      QueryExecutionId: queryExecutionId,
      MaxResults: 1000,
    })
  );

  const rows = resultsResp.ResultSet?.Rows ?? [];

  if (rows.length === 0) {
    return [
      {
        deviceId: deviceIdArg,
        points: [],
      },
    ];
  }

  const columnNames = (rows[0].Data ?? []).map(
    (cell) => cell.VarCharValue ?? ""
  );

  const dataRows: AthenaRow[] = rows.slice(1).map((row) => {
    const obj: AthenaRow = {};

    row.Data?.forEach((cell, index) => {
      obj[columnNames[index]] = cell.VarCharValue ?? null;
    });

    return obj;
  });

  console.log(
    "[getFarmIotData] Raw rows:",
    JSON.stringify(dataRows, null, 2)
  );

  const points = dataRows
    .filter((row) => row.timestamp != null && row.value != null)
    .map((row) => ({
      timestamp: row.timestamp as string,
      value: parseFloat(row.value as string),
      metricType: row.metric_type ?? metricType,
    }))
    .filter((point) => !Number.isNaN(point.value));

  console.log(
    "[getFarmIotData] Returning deviceId",
    deviceIdArg,
    "with",
    points.length,
    "points"
  );

  return [
    {
      deviceId: deviceIdArg,
      points,
    },
  ];
};
