import { defineFunction } from '@aws-amplify/backend';

export const getDeviceDataFn = defineFunction({
  name: 'get-device-data',
  entry: './handler.ts',
});