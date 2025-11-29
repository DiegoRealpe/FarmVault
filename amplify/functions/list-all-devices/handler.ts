import type { Schema } from '../../data/resource';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import outputs from "../../../amplify_outputs.json"

Amplify.configure(outputs);

const client = generateClient<Schema>();

// Strongly-typed handler based on your schema
export const handler: Schema['listAllDevices']['functionHandler'] = async (event) => {
  const { farmId } = event.arguments;

  // In this first iteration we don't care who the user is;
  // both farmAdmin and tempViewer see the same list.
  // (Later we'll plug in grants here.)
  const result = await client.models.IoTDevice.list({
    filter: {
      farmId: { eq: farmId },
    },
  });

  const devices = result.data ?? [];

  // Map IoTDevice -> IoTDeviceView
  const views: Schema['IoTDeviceView']['type'][] = devices.map((d) => ({
    id: d.id,
    type: d.type,
    farmId: d.farmId,
    devEui: d.devEui,
    name: d.name ?? null,
    location: d.location ?? null
  }));

  return views;
};