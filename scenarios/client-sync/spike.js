import { getEnv } from '../lib/env.js';
import { clientSyncSpikeOptions } from '../lib/profiles/client-sync.js';
import { setupClientSyncTest } from '../lib/setup/client-sync-setup.js';
import { runGetClientIteration } from '../lib/flows/client-sync-flows.js';

const ENVIRONMENT = getEnv('ENVIRONMENT');

export const options = clientSyncSpikeOptions({
  environment: ENVIRONMENT || 'unset',
  profile: 'client-sync',
  scenario: 'spike',
});

export function setup() {
  return setupClientSyncTest('Spike');
}

export default function (data) {
  runGetClientIteration(data);
}
