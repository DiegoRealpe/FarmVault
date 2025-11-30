import { defineStorage } from "@aws-amplify/backend";
import { getFarmIotDataFn } from "../functions/get-device-data/resource";

export const metricsBucket = defineStorage({
  name: "metrics-bucket",
  access: (allow) => ({
    "raw/*": [
      allow.guest.to(["read"]),
      allow.authenticated.to(["read", "write"]),
      allow.resource(getFarmIotDataFn).to(["read", "write", "delete"]),
    ],
    "parquet/*": [
      allow.guest.to(["read"]),
      allow.authenticated.to(["read", "write"]),
      allow.resource(getFarmIotDataFn).to(["read", "write", "delete"]),
    ],
    "scripts/*": [
      allow.guest.to(["read"]),
      allow.authenticated.to(["read", "write"]),
      allow.resource(getFarmIotDataFn).to(["read", "write", "delete"]),
    ],
    "athena-results/*": [
      allow.guest.to(["read"]),
      allow.authenticated.to(["read", "write"]),
      allow.resource(getFarmIotDataFn).to(["read", "write", "delete"]),
    ],
  }),
});
