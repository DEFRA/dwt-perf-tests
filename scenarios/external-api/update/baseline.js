import { getEnv } from '../../lib/env.js';
import {
  baselineOptions,
  THRESHOLDS_MS,
} from '../../lib/profiles/external-api.js';
import { setupExternalApiTest } from '../../lib/setup/external-api-setup.js';
import { runCreateUpdateIteration } from '../../lib/flows/external-api-flows.js';

const ENVIRONMENT = getEnv('ENVIRONMENT');

export const options = baselineOptions(THRESHOLDS_MS.baseline, {
  environment: ENVIRONMENT || 'unset',
  profile: 'external-api',
  scenario: 'update-baseline',
});

export function setup() {
  return setupExternalApiTest('Baseline');
}

export default function (data) {
  runCreateUpdateIteration(data);
}
