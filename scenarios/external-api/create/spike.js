import { getEnv } from '../../lib/env.js';
import {
  spikeOptions,
  THRESHOLDS_MS,
} from '../../lib/profiles/external-api.js';
import { setupExternalApiTest } from '../../lib/setup/external-api-setup.js';
import { runCreateIteration } from '../../lib/flows/external-api-flows.js';

const ENVIRONMENT = getEnv('ENVIRONMENT');

export const options = spikeOptions(THRESHOLDS_MS.spike, {
  environment: ENVIRONMENT || 'unset',
  profile: 'external-api',
  scenario: 'create-spike',
});

export function setup() {
  return setupExternalApiTest('Spike');
}

export default function (data) {
  runCreateIteration(data);
}
