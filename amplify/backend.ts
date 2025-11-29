import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { listDevices } from './functions/list-devices/resource';

defineBackend({
  auth,
  data,
  listDevices
});
