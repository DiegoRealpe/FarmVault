import { defineFunction } from '@aws-amplify/backend';

export const listAllDevicesFn = defineFunction({
  entry: './handler.ts'
});