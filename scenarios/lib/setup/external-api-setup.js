import { getCognitoAccessToken } from '../auth/cognito-auth.js';
import {
  getExternalApiBaseUrl,
  requireEnv,
  requireEnvironment,
} from '../env.js';

/**
 * Shared setup for external-api profile scripts.
 * @param {string} testType - Baseline | Load | Stress | Spike
 * @returns {{ accessToken: string, baseUrl: string, apiCode: string, environment: string, testType: string }}
 */
export function setupExternalApiTest(testType) {
  const environment = requireEnvironment();
  const apiCode = requireEnv('API_CODE');
  const baseUrl = getExternalApiBaseUrl(environment);

  console.log(`external-api ${testType} — environment: ${environment}`);
  console.log(`External API base URL: ${baseUrl}`);

  const accessToken = getCognitoAccessToken({
    clientId: requireEnv('COGNITO_CLIENT_ID'),
    clientSecret: requireEnv('COGNITO_CLIENT_SECRET'),
    oauthBaseUrl: requireEnv('COGNITO_OAUTH_BASE_URL'),
  });

  return { accessToken, baseUrl, apiCode, environment, testType };
}
