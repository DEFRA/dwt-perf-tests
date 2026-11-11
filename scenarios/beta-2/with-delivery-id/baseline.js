import { getEnv } from '../../lib/env.js';
import { beta2BaselineOptions } from '../../lib/profiles/beta-2.js';
import { setupBeta2Test } from '../../lib/setup/beta-2-setup.js';
import { runBeta2JourneyIteration } from '../../lib/flows/beta-2-flows.js';

const ENVIRONMENT = getEnv('ENVIRONMENT');

export const options = beta2BaselineOptions({
  environment: ENVIRONMENT || 'unset',
  profile: 'beta-2',
  scenario: 'with-delivery-id-baseline',
});

export function setup() {
  return setupBeta2Test('Baseline');
}

export default function (data) {
  runBeta2JourneyIteration(data);
}
