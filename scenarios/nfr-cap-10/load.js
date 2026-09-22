import { getEnv } from '../lib/env.js';
import { loadOptions } from '../lib/profiles/nfr-cap-10.js';
import { setupExternalApiTest } from '../lib/setup/external-api-setup.js';
import { runCreatePartialUpdateWasteMovementIteration } from '../lib/flows/external-api-flows.js';

const ENVIRONMENT = getEnv('ENVIRONMENT');

export const options = loadOptions({
  environment: ENVIRONMENT || 'unset',
  profile: 'nfr-cap-10',
  scenario: 'load',
});

export function setup() {
  return setupExternalApiTest('Load');
}

export default function (data) {
  runCreatePartialUpdateWasteMovementIteration(data);
}
