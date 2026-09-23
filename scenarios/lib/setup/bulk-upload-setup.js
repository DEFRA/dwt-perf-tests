import {
  getBackendBaseUrl,
  getEnv,
  requireEnv,
  requireEnvironment,
} from '../env.js';

/**
 * Shared setup for bulk-upload profile scripts.
 * @param {string} testType - Baseline | Load | Stress | Spike
 * @returns {{ serviceAuthToken: string, apiKey: string, baseUrl: string, environment: string, testType: string }}
 */
export function setupBulkUploadTest(testType) {
  const environment = requireEnvironment();
  const baseUrl = getBackendBaseUrl(environment);
  const serviceAuthToken = requireEnv('SERVICE_AUTH_WASTE_ORGANISATION_BACKEND');
  const apiKey = getEnv('CDP_API_KEY');

  console.log(`bulk-upload ${testType} — environment: ${environment}`);
  console.log(`Waste movement backend URL: ${baseUrl}`);

  return { serviceAuthToken, apiKey, baseUrl, environment, testType };
}
