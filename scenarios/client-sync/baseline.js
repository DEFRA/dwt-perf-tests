import { getEnv } from '../lib/env.js';
import { clientSyncBaselineOptions } from '../lib/profiles/client-sync.js';
import { setupClientSyncTest } from '../lib/setup/client-sync-setup.js';
import { runGetClientIteration } from '../lib/flows/client-sync-flows.js';

const ENVIRONMENT = getEnv('ENVIRONMENT');

export const options = clientSyncBaselineOptions({
  environment: ENVIRONMENT || 'unset',
  profile: 'client-sync',
  scenario: 'baseline',
});

export function setup() {
  return setupClientSyncTest('Baseline');
}

export default function (data) {
  runGetClientIteration(data);
}
