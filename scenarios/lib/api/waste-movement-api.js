import http from 'k6/http';
import { getEnv } from '../env.js';

/**
 * @returns {string}
 */
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Headers for external API calls.
 * Bearer + Content-Type; x-cdp-request-id only when ENVIRONMENT=local.
 *
 * @param {string} accessToken
 * @param {Record<string, string>} [extra]
 * @returns {Record<string, string>}
 */
export function authHeaders(accessToken, extra = {}) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
    ...extra,
  };

  if (getEnv('ENVIRONMENT') === 'local') {
    headers['x-cdp-request-id'] = uuidv4();
  }

  return headers;
}

/**
 * POST /movements/receive — create a waste movement.
 *
 * @param {string} baseUrl
 * @param {string} accessToken
 * @param {Object} movementData
 * @param {Record<string, string>} [tags]
 * @returns {import('k6/http').RefinedResponse}
 */
export function receiveMovement(baseUrl, accessToken, movementData, tags = {}) {
  return http.post(
    `${baseUrl.replace(/\/$/, '')}/movements/receive`,
    JSON.stringify(movementData),
    {
      headers: authHeaders(accessToken, {
        'Content-Type': 'application/json',
      }),
      tags,
      timeout: '60s',
    }
  );
}

/**
 * PUT /movements/{wasteTrackingId}/receive — update a waste movement.
 *
 * @param {string} baseUrl
 * @param {string} accessToken
 * @param {string} wasteTrackingId
 * @param {Object} movementData
 * @param {Record<string, string>} [tags]
 * @returns {import('k6/http').RefinedResponse}
 */
export function receiveMovementWithId(
  baseUrl,
  accessToken,
  wasteTrackingId,
  movementData,
  tags = {}
) {
  return http.put(
    `${baseUrl.replace(/\/$/, '')}/movements/${wasteTrackingId}/receive`,
    JSON.stringify(movementData),
    {
      headers: authHeaders(accessToken, {
        'Content-Type': 'application/json',
      }),
      tags,
      timeout: '60s',
    }
  );
}
