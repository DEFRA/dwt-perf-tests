import http from 'k6/http';
import { authHeaders } from './waste-movement-api.js';

/**
 * @param {string} baseUrl
 * @returns {string}
 */
function base(baseUrl) {
  return baseUrl.replace(/\/$/, '');
}

/**
 * Bearer auth plus the organisation API code. apiCode is never part of the body.
 * @param {string} accessToken
 * @param {string} apiCode
 * @returns {Record<string, string>}
 */
function beta2Headers(accessToken, apiCode) {
  return authHeaders(accessToken, {
    'Content-Type': 'application/json',
    'x-api-code': apiCode,
  });
}

/**
 * @param {string} accessToken
 * @param {string} apiCode
 * @param {Record<string, string>} tags
 * @returns {Object}
 */
function postParams(accessToken, apiCode, tags) {
  return {
    headers: beta2Headers(accessToken, apiCode),
    tags,
    timeout: '60s',
  };
}

/**
 * POST /beta-2/movements
 * @param {string} baseUrl
 * @param {string} accessToken
 * @param {string} apiCode
 * @param {Object} movementData
 * @param {Record<string, string>} [tags]
 * @returns {import('k6/http').RefinedResponse}
 */
export function createMovement(baseUrl, accessToken, apiCode, movementData, tags = {}) {
  return http.post(
    `${base(baseUrl)}/beta-2/movements`,
    JSON.stringify(movementData),
    postParams(accessToken, apiCode, tags)
  );
}

/**
 * POST /beta-2/movements/{movementId}/collection
 * @param {string} baseUrl
 * @param {string} accessToken
 * @param {string} apiCode
 * @param {string} movementId
 * @param {Object} collectionData
 * @param {Record<string, string>} [tags]
 * @returns {import('k6/http').RefinedResponse}
 */
export function createCollection(
  baseUrl,
  accessToken,
  apiCode,
  movementId,
  collectionData,
  tags = {}
) {
  return http.post(
    `${base(baseUrl)}/beta-2/movements/${encodeURIComponent(movementId)}/collection`,
    JSON.stringify(collectionData),
    postParams(accessToken, apiCode, tags)
  );
}

/**
 * POST /beta-2/deliveries
 * @param {string} baseUrl
 * @param {string} accessToken
 * @param {string} apiCode
 * @param {Object} deliveryData
 * @param {Record<string, string>} [tags]
 * @returns {import('k6/http').RefinedResponse}
 */
export function createDelivery(baseUrl, accessToken, apiCode, deliveryData, tags = {}) {
  return http.post(
    `${base(baseUrl)}/beta-2/deliveries`,
    JSON.stringify(deliveryData),
    postParams(accessToken, apiCode, tags)
  );
}

/**
 * POST /beta-2/deliveries/{deliveryId}/receipt
 * @param {string} baseUrl
 * @param {string} accessToken
 * @param {string} apiCode
 * @param {string} deliveryId
 * @param {Object} receiptData
 * @param {Record<string, string>} [tags]
 * @returns {import('k6/http').RefinedResponse}
 */
export function createReceipt(
  baseUrl,
  accessToken,
  apiCode,
  deliveryId,
  receiptData,
  tags = {}
) {
  return http.post(
    `${base(baseUrl)}/beta-2/deliveries/${encodeURIComponent(deliveryId)}/receipt`,
    JSON.stringify(receiptData),
    postParams(accessToken, apiCode, tags)
  );
}

/**
 * POST /beta-2/receipts — receipt with no delivery id. The response mints a delivery id.
 * @param {string} baseUrl
 * @param {string} accessToken
 * @param {string} apiCode
 * @param {Object} receiptData
 * @param {Record<string, string>} [tags]
 * @returns {import('k6/http').RefinedResponse}
 */
export function createReceiptWithoutDeliveryId(
  baseUrl,
  accessToken,
  apiCode,
  receiptData,
  tags = {}
) {
  return http.post(
    `${base(baseUrl)}/beta-2/receipts`,
    JSON.stringify(receiptData),
    postParams(accessToken, apiCode, tags)
  );
}
