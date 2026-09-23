import http from 'k6/http';
import { uuidv4 } from '../data/bulk-waste-movement-payload.js';

/**
 * Headers for bulk backend calls (Basic service auth + CDP API key).
 * @param {string} serviceAuthToken - value after "Basic " (same as JMeter SERVICE_AUTH prop)
 * @param {string} [apiKey]
 * @returns {Record<string, string>}
 */
export function bulkAuthHeaders(serviceAuthToken, apiKey = '') {
  return {
    'Content-Type': 'application/json',
    Authorization: `Basic ${serviceAuthToken}`,
    'x-api-key': apiKey || '',
    'Accept-Encoding': 'identity',
    'x-cdp-request-id': uuidv4(),
  };
}

/**
 * POST /bulk/{bulkUploadId}/movements/receive
 * @param {string} baseUrl
 * @param {string} serviceAuthToken
 * @param {string} apiKey
 * @param {string} bulkUploadId
 * @param {Object[]} movements
 * @param {Record<string, string>} [tags]
 */
export function bulkReceiveMovements(
  baseUrl,
  serviceAuthToken,
  apiKey,
  bulkUploadId,
  movements,
  tags = {}
) {
  return http.post(
    `${baseUrl.replace(/\/$/, '')}/bulk/${bulkUploadId}/movements/receive`,
    JSON.stringify(movements),
    {
      headers: bulkAuthHeaders(serviceAuthToken, apiKey),
      tags,
      timeout: '60s',
    }
  );
}

/**
 * PUT /bulk/{bulkUploadId}/movements/receive
 * @param {string} baseUrl
 * @param {string} serviceAuthToken
 * @param {string} apiKey
 * @param {string} bulkUploadId
 * @param {Object[]} movements
 * @param {Record<string, string>} [tags]
 */
export function bulkUpdateMovements(
  baseUrl,
  serviceAuthToken,
  apiKey,
  bulkUploadId,
  movements,
  tags = {}
) {
  return http.put(
    `${baseUrl.replace(/\/$/, '')}/bulk/${bulkUploadId}/movements/receive`,
    JSON.stringify(movements),
    {
      headers: bulkAuthHeaders(serviceAuthToken, apiKey),
      tags,
      timeout: '60s',
    }
  );
}
