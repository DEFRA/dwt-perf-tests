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
 * Comma-separated ids from the one-time catalogue fetch in entrypoint.sh.
 * @returns {string[]|null} null when this process must fetch the catalogue itself
 */
function preloadedClientIds() {
  const raw = getEnv('CLIENT_SYNC_CLIENT_IDS');
  if (!raw) {
    return null;
  }
  return raw
    .split(',')
    .map((id) => id.trim())
    .filter((id) => !!id);
}

/**
 * Shared setup for client-sync profile scripts.
 * The profile runner loads the catalogue once and passes it in
 * CLIENT_SYNC_CLIENT_IDS. A standalone k6 run fetches it here, still
 * once, before any VU starts.
 * @param {string} testType - Baseline | Load | Stress | Spike | Catalogue
 * @returns {{ serviceAuthToken: string, apiKey: string, baseUrl: string, clientIds: string[], environment: string, testType: string }}
 */
export function setupClientSyncTest(testType) {
  const environment = requireEnvironment();
  const baseUrl = getClientSyncBaseUrl(environment);
  const serviceAuthToken = requireEnv('SERVICE_AUTH_DWT_CLIENT_SYNC');
  const apiKey = getEnv('CDP_API_KEY');

  console.log(`client-sync ${testType} — environment: ${environment}`);
  console.log(`Client sync base URL: ${baseUrl}`);

  const preloaded = preloadedClientIds();
  if (preloaded) {
    if (preloaded.length === 0) {
      fail('CLIENT_SYNC_CLIENT_IDS is set but contains no client IDs');
    }
    console.log(
      `Using ${preloaded.length} client IDs from the catalogue loaded before the scenarios`
    );
    return {
      serviceAuthToken,
      apiKey,
      baseUrl,
      clientIds: preloaded,
      environment,
      testType,
    };
  }

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
