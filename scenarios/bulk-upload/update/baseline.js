import { getEnv } from '../../lib/env.js';
import { bulkBaselineOptions } from '../../lib/profiles/bulk-upload.js';
import { setupBulkUploadTest } from '../../lib/setup/bulk-upload-setup.js';
import { runBulkCreateUpdateIteration } from '../../lib/flows/bulk-upload-flows.js';

const ENVIRONMENT = getEnv('ENVIRONMENT');

export const options = bulkBaselineOptions({
  environment: ENVIRONMENT || 'unset',
  profile: 'bulk-upload',
  scenario: 'update-baseline',
});

export function setup() {
  return setupBulkUploadTest('Baseline');
}

export default function (data) {
  runBulkCreateUpdateIteration(data);
}
