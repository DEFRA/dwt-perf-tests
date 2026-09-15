import http from 'k6/http';
import encoding from 'k6/encoding';
import { fail } from 'k6';

/**
 * Obtain a Cognito access token via OAuth2 client_credentials.
 *
 * @param {{ clientId: string, clientSecret: string, oauthBaseUrl: string }} credentials
 * @returns {string} access_token
 */
export function getCognitoAccessToken({ clientId, clientSecret, oauthBaseUrl }) {
  if (
    !clientId ||
    !clientSecret ||
    !oauthBaseUrl ||
    clientId === 'REPLACE_ME' ||
    clientSecret === 'REPLACE_ME'
  ) {
    fail(
      'Set COGNITO_CLIENT_ID, COGNITO_CLIENT_SECRET and COGNITO_OAUTH_BASE_URL (CDP secrets or .env for ./run-perf-test.sh)'
    );
  }

  const baseUrl = oauthBaseUrl.replace(/\/$/, '');
  const credentials = encoding.b64encode(`${clientId}:${clientSecret}`);

  const tokenRes = http.post(
    `${baseUrl}/oauth2/token`,
    { grant_type: 'client_credentials' },
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
    }
  );

  if (tokenRes.status !== 200) {
    fail(`Cognito token request failed: ${tokenRes.status} ${tokenRes.body}`);
  }

  const body = tokenRes.json();
  if (!body.access_token) {
    fail(`Cognito response missing access_token: ${tokenRes.body}`);
  }

  return body.access_token;
}
