import { defineFunction } from '@aws-amplify/backend';

export const listDevices = defineFunction({
  entry: './handler.ts'
});