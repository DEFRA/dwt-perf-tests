import http from 'k6/http';
import { apiKeyHeader } from '../env.js';

/** Tenant whose clients this profile reads. */
export const TENANT_SERVICE_NAME = 'waste-movement-external-api';

/**
 * Headers for dwt-client-sync (Basic service auth).
 * x-api-key is added only when CI is not true.
 * @param {string} serviceAuthToken - value after "Basic "
 * @param {string} [apiKey]
 * @returns {Record<string, string>}
 */
export function clientSyncHeaders(serviceAuthToken, apiKey = '') {
  return {
    Accept: 'application/json',
    Authorization: `Basic ${serviceAuthToken}`,
    'Accept-Encoding': 'identity',
    ...apiKeyHeader(apiKey),
  };
}

/**
 * GET /clients/{tenant} — catalogue used once in setup.
 * Tagged `name:List Clients` so it stays out of the measured GET thresholds.
 *
 * @param {string} baseUrl
 * @param {string} serviceAuthToken
 * @param {string} apiKey
 * @param {Record<string, string>} [tags]
 * @returns {import('k6/http').RefinedResponse}
 */
export function getClients(baseUrl, serviceAuthToken, apiKey, tags = {}) {
  return http.get(
    `${baseUrl.replace(/\/$/, '')}/clients/${TENANT_SERVICE_NAME}`,
    {
      headers: clientSyncHeaders(serviceAuthToken, apiKey),
      tags: { ...tags, name: 'List Clients' },
      timeout: '60s',
    }
  );
}

/**
 * GET /clients/{tenant}/{clientId}
 * Tagged `name:Get Client` so duration thresholds apply only to this call.
 *
 * @param {string} baseUrl
 * @param {string} serviceAuthToken
 * @param {string} apiKey
 * @param {string} clientId
 * @param {Record<string, string>} [tags]
 * @returns {import('k6/http').RefinedResponse}
 */
export function getClient(
  baseUrl,
  serviceAuthToken,
  apiKey,
  clientId,
  tags = {}
) {
  return http.get(
    `${baseUrl.replace(/\/$/, '')}/clients/${TENANT_SERVICE_NAME}/${clientId}`,
    {
      headers: clientSyncHeaders(serviceAuthToken, apiKey),
      tags: { ...tags, name: 'Get Client' },
      timeout: '60s',
    }
  );
}
