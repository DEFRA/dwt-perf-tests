import { check } from 'k6';
import { getClient } from '../api/client-sync-api.js';
import { thinkTime } from '../think-time.js';

/**
 * Uniform pick from the catalogue. Two VUs may select the same id.
 * @param {string[]} clientIds
 * @returns {string}
 */
function pickClientId(clientIds) {
  return clientIds[Math.floor(Math.random() * clientIds.length)];
}

/**
 * GET /clients/{tenant}/{clientId}.
 * The calling VU chooses a new random id immediately before this request.
 * @param {{ serviceAuthToken: string, apiKey: string, baseUrl: string, clientIds: string[], environment: string, testType: string }} data
 */
export function runGetClientIteration(data) {
  const clientId = pickClientId(data.clientIds);

  const res = getClient(
    data.baseUrl,
    data.serviceAuthToken,
    data.apiKey,
    clientId,
    {
      environment: data.environment,
      testType: data.testType,
    }
  );

  let returnedId = null;
  try {
    returnedId = res.json('clientId');
  } catch (e) {
    returnedId = null;
  }

  const ok = check(res, {
    'get client status is 200': (r) => r.status === 200,
    'get client id matches': () => returnedId === clientId,
  });

  if (!ok) {
    console.error(`Get client failed: status=${res.status}`);
  }

  thinkTime();
}
