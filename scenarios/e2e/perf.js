import { getEnv } from '../lib/env.js';
import { e2ePerfOptions } from '../lib/profiles/e2e.js';
import { setupE2eTest } from '../lib/setup/e2e-setup.js';
import { runE2eIteration } from '../lib/flows/e2e-flows.js';

const ENVIRONMENT = getEnv('ENVIRONMENT');

export const options = e2ePerfOptions({
  environment: ENVIRONMENT || 'unset',
  profile: 'e2e',
  scenario: 'perf',
});

export function setup() {
  return setupE2eTest();
}

export default function (data) {
  runE2eIteration(data);
}
