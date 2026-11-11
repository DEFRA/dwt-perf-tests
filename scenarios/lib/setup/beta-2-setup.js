import { getCognitoAccessToken } from '../auth/cognito-auth.js';
import {
  getExternalApiBaseUrl,
  requireEnv,
  requireEnvironment,
} from '../env.js';

/**
 * Shared setup for the beta-2 profile. One Cognito token is reused for the journey.
 * @param {string} testType - Baseline
 * @returns {{ accessToken: string, baseUrl: string, apiCode: string, environment: string, testType: string }}
 */
export function setupBeta2Test(testType) {
  const environment = requireEnvironment();
  const apiCode = requireEnv('API_CODE');
  const baseUrl = getExternalApiBaseUrl(environment);

  console.log(`beta-2 ${testType} — environment: ${environment}`);
  console.log(`External API base URL: ${baseUrl}`);

  const accessToken = getCognitoAccessToken({
    clientId: requireEnv('COGNITO_CLIENT_ID'),
    clientSecret: requireEnv('COGNITO_CLIENT_SECRET'),
    oauthBaseUrl: requireEnv('COGNITO_OAUTH_BASE_URL'),
  });

  return { accessToken, baseUrl, apiCode, environment, testType };
}
