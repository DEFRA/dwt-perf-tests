import { getEnv } from '../../lib/env.js';
import {
  bulkLoadOrStressOptions,
  BULK_VUS,
} from '../../lib/profiles/bulk-upload.js';
import { setupBulkUploadTest } from '../../lib/setup/bulk-upload-setup.js';
import { runBulkCreateUpdateIteration } from '../../lib/flows/bulk-upload-flows.js';

const ENVIRONMENT = getEnv('ENVIRONMENT');

export const options = bulkLoadOrStressOptions(BULK_VUS.load, {
  environment: ENVIRONMENT || 'unset',
  profile: 'bulk-upload',
  scenario: 'update-load',
});

export function setup() {
  return setupBulkUploadTest('Load');
}

export default function (data) {
  runBulkCreateUpdateIteration(data);
}
