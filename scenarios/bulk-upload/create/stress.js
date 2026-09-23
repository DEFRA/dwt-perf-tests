import { getEnv } from '../../lib/env.js';
import {
  bulkLoadOrStressOptions,
  BULK_VUS,
} from '../../lib/profiles/bulk-upload.js';
import { setupBulkUploadTest } from '../../lib/setup/bulk-upload-setup.js';
import { runBulkCreateIteration } from '../../lib/flows/bulk-upload-flows.js';

const ENVIRONMENT = getEnv('ENVIRONMENT');

export const options = bulkLoadOrStressOptions(BULK_VUS.stress, {
  environment: ENVIRONMENT || 'unset',
  profile: 'bulk-upload',
  scenario: 'create-stress',
});

export function setup() {
  return setupBulkUploadTest('Stress');
}

export default function (data) {
  runBulkCreateIteration(data);
}
