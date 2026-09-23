import { getEnv } from '../../lib/env.js';
import { bulkSpikeOptions } from '../../lib/profiles/bulk-upload.js';
import { setupBulkUploadTest } from '../../lib/setup/bulk-upload-setup.js';
import { runBulkCreateIteration } from '../../lib/flows/bulk-upload-flows.js';

const ENVIRONMENT = getEnv('ENVIRONMENT');

export const options = bulkSpikeOptions({
  environment: ENVIRONMENT || 'unset',
  profile: 'bulk-upload',
  scenario: 'create-spike',
});

export function setup() {
  return setupBulkUploadTest('Spike');
}

export default function (data) {
  runBulkCreateIteration(data);
}
