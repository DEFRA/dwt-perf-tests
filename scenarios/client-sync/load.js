import { getEnv } from '../lib/env.js';
import { clientSyncLoadOptions } from '../lib/profiles/client-sync.js';
import { setupClientSyncTest } from '../lib/setup/client-sync-setup.js';
import { runGetClientIteration } from '../lib/flows/client-sync-flows.js';

const ENVIRONMENT = getEnv('ENVIRONMENT');

export const options = clientSyncLoadOptions({
  environment: ENVIRONMENT || 'unset',
  profile: 'client-sync',
  scenario: 'load',
});

export function setup() {
  return setupClientSyncTest('Load');
}

export default function (data) {
  runGetClientIteration(data);
}
