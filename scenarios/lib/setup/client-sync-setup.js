import { fail } from 'k6';
import { getClients } from '../api/client-sync-api.js';
import {
  getClientSyncBaseUrl,
  getEnv,
  requireEnv,
  requireEnvironment,
} from '../env.js';

/**
 * @param {import('k6/http').RefinedResponse} res
 * @returns {string[]}
 */
function extractClientIds(res) {
  try {
    const body = res.json();
    if (!Array.isArray(body)) {
      return [];
    }
    return body.map((client) => client && client.clientId).filter((id) => !!id);
  } catch (e) {
    return [];
  }
}

/**
 * Shared setup for client-sync profile scripts.
 * Runs once per scenario, before any VU starts, and loads the client list.
 * @param {string} testType - Baseline | Load | Stress | Spike
 * @returns {{ serviceAuthToken: string, apiKey: string, baseUrl: string, clientIds: string[], environment: string, testType: string }}
 */
export function setupClientSyncTest(testType) {
  const environment = requireEnvironment();
  const baseUrl = getClientSyncBaseUrl(environment);
  const serviceAuthToken = requireEnv('SERVICE_AUTH_DWT_CLIENT_SYNC');
  const apiKey = getEnv('CDP_API_KEY');

  console.log(`client-sync ${testType} — environment: ${environment}`);
  console.log(`Client sync base URL: ${baseUrl}`);

  const res = getClients(baseUrl, serviceAuthToken, apiKey, {
    environment,
    testType,
  });
  const clientIds = extractClientIds(res);

  if (res.status !== 200 || clientIds.length === 0) {
    fail(
      `List clients failed: status=${res.status} clientIds=${clientIds.length}`
    );
  }

  console.log(`Loaded ${clientIds.length} client IDs`);

  return {
    serviceAuthToken,
    apiKey,
    baseUrl,
    clientIds,
    environment,
    testType,
  };
}
