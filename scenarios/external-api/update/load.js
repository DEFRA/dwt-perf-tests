import { getEnv } from '../../lib/env.js';
import {
  loadOrStressOptions,
  THRESHOLDS_MS,
} from '../../lib/profiles/external-api.js';
import { setupExternalApiTest } from '../../lib/setup/external-api-setup.js';
import { runCreateUpdateIteration } from '../../lib/flows/external-api-flows.js';

const ENVIRONMENT = getEnv('ENVIRONMENT');

export const options = loadOrStressOptions(50, THRESHOLDS_MS.load, {
  environment: ENVIRONMENT || 'unset',
  profile: 'external-api',
  scenario: 'update-load',
});

export function setup() {
  return setupExternalApiTest('Load');
}

export default function (data) {
  runCreateUpdateIteration(data);
}
