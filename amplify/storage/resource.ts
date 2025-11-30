import { defineStorage } from '@aws-amplify/backend';
import { getFarmIotDataFn } from '../functions/get-farm-iot-data/resource';

export const metricsBucket = defineStorage({
  name: 'metrics-bucket',
  access: (allow) => ({
    '*': [
      allow.guest.to(['read']), // optional – for public read
      allow.authenticated.to(['read', 'write']), // optional
      allow.resource(getFarmIotDataFn)
    ],
  }),
});
