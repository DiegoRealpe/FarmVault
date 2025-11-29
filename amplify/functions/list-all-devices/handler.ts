import type { Schema } from '../../data/resource';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/list-all-devices';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

// Mock returned when an item is unexpectedly null
const MOCK_DEVICE_VIEW: Schema['IoTDeviceView']['type'] = {
  id: 'mock-device',
  type: 'TEMPERATURE',
  farmId: 'mock-farm',
  devEui: '0000000000000000',
  applicationId: 'mock-app',
  gatewayId: null,
  name: 'Mock Device (data was null)',
  description: 'This entry was returned because the lambda received a null or malformed item.',
  location: 'Unknown'
};

export const handler: Schema['listAllDevices']['functionHandler'] = async (event) => {
  console.log('listAllDevices event:', JSON.stringify(event, null, 2));

  try {
    const { farmId } = event.arguments;

    const result = await client.models.IoTDevice.list({
      filter: { farmId: { eq: farmId } },
    });

    console.log('raw result:', JSON.stringify(result, null, 2));

    const devices = result.data ?? [];

    const views: Schema['IoTDeviceView']['type'][] = devices.map((d, index) => {
      if (!d) {
        console.warn(
          `Null entry encountered at index ${index}. Returning mock device.`
        );
        return MOCK_DEVICE_VIEW;
      }

      return {
        id: d.id ?? 'missing-id',
        type: d.type ?? 'TEMPERATURE',
        farmId: d.farmId ?? 'missing-farm',
        devEui: d.devEui ?? 'missing-eui',
        applicationId: d.applicationId ?? 'missing-app',
        gatewayId: d.gatewayId ?? null,
        name: d.name ?? null,
        description: d.description ?? null,
        location: d.location ?? null
      };
    });

    console.log('views to return:', JSON.stringify(views, null, 2));
    return views;

  } catch (err: any) {
    console.error('listAllDevices ERROR:', err);

    throw new Error(
      'listAllDevices failed → ' +
      JSON.stringify(
        {
          message: err?.message ?? String(err),
          stack: err?.stack,
          event
        },
        null,
        2
      )
    );
  }
};
