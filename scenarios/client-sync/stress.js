import { getEnv } from '../lib/env.js';
import { clientSyncStressOptions } from '../lib/profiles/client-sync.js';
import { setupClientSyncTest } from '../lib/setup/client-sync-setup.js';
import { runGetClientIteration } from '../lib/flows/client-sync-flows.js';

const ENVIRONMENT = getEnv('ENVIRONMENT');

export const options = clientSyncStressOptions({
  environment: ENVIRONMENT || 'unset',
  profile: 'client-sync',
  scenario: 'stress',
});

export function setup() {
  return setupClientSyncTest('Stress');
}

export default function (data) {
  runGetClientIteration(data);
}
