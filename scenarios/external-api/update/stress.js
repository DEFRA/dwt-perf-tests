import { getEnv } from '../../lib/env.js';
import {
  loadOrStressOptions,
  THRESHOLDS_MS,
} from '../../lib/profiles/external-api.js';
import { setupExternalApiTest } from '../../lib/setup/external-api-setup.js';
import { runCreateUpdateWasteMovementIteration } from '../../lib/flows/external-api-flows.js';

const ENVIRONMENT = getEnv('ENVIRONMENT');

export const options = loadOrStressOptions(100, THRESHOLDS_MS.stress, {
  environment: ENVIRONMENT || 'unset',
  profile: 'external-api',
  scenario: 'update-stress',
});

export function setup() {
  return setupExternalApiTest('Stress');
}

export default function (data) {
  runCreateUpdateWasteMovementIteration(data);
}
