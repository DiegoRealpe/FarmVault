import type { Schema } from '../../data/resource';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/list-all-devices';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

export const handler: Schema['listAllDevices']['functionHandler'] = async (event) => {
  try {
    const { farmId } = event.arguments;

    const response = await client.models.IoTDevice.list({
      filter: { farmId: { eq: farmId } },
    });

    // Throw an error containing the entire IoTDevice.list() response
    throw new Error(
      "IoTDevice.list() raw response → " +
        JSON.stringify(
          {
            event,
            response
          },
          null,
          2
        )
    );
  } catch (err: any) {
    // If something else goes wrong, also throw it with detail
    throw new Error(
      "listAllDevices failed → " +
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
