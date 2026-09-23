import { check } from 'k6';
import { vu } from 'k6/execution';
import {
  BULK_MOVEMENT_COUNT,
  generateBulkCreatePayload,
  generateBulkUpdatePayload,
  uuidv4,
} from '../data/bulk-waste-movement-payload.js';
import {
  bulkReceiveMovements,
  bulkUpdateMovements,
} from '../api/bulk-waste-movement-api.js';
import { thinkTime } from '../think-time.js';

/**
 * @returns {number}
 */
function vuIndex() {
  return vu.idInTest - 1;
}

/**
 * @param {import('k6/http').RefinedResponse} res
 * @returns {string[]}
 */
function extractWasteTrackingIds(res) {
  try {
    const body = res.json();
    if (!body || !body.movements || !Array.isArray(body.movements)) {
      return [];
    }
    return body.movements
      .map((m) => m && m.wasteTrackingId)
      .filter((id) => !!id);
  } catch (e) {
    return [];
  }
}

/**
 * Bulk create-only iteration (POST /bulk/{id}/movements/receive).
 * @param {{ serviceAuthToken: string, apiKey: string, baseUrl: string, environment: string, testType: string }} data
 * @param {string} [bulkUploadId] - reuse when create+update must share the same id
 * @returns {{ orgId: string, wasteTrackingIds: string[], bulkUploadId: string }|null}
 */
export function runBulkCreateIteration(data, bulkUploadId = uuidv4()) {
  const index = vuIndex();
  const { orgId, movements } = generateBulkCreatePayload(
    data.testType,
    index
  );

  const res = bulkReceiveMovements(
    data.baseUrl,
    data.serviceAuthToken,
    data.apiKey,
    bulkUploadId,
    movements,
    {
      environment: data.environment,
      name: 'Bulk Create Waste Movement',
      testType: data.testType,
    }
  );

  const wasteTrackingIds = extractWasteTrackingIds(res);
  const ok = check(res, {
    'bulk create status is 201': (r) => r.status === 201,
    'bulk create has wasteTrackingId': () => wasteTrackingIds.length > 0,
    [`bulk create returns ${BULK_MOVEMENT_COUNT} movements`]: () =>
      wasteTrackingIds.length === BULK_MOVEMENT_COUNT,
  });

  if (!ok) {
    console.error(`Bulk create failed: ${res.status} ${res.body}`);
  }

  thinkTime();

  if (!ok || wasteTrackingIds.length === 0) {
    return null;
  }

  return { orgId, wasteTrackingIds, bulkUploadId };
}

/**
 * Bulk create then update (POST then PUT /bulk/{id}/movements/receive).
 * @param {{ serviceAuthToken: string, apiKey: string, baseUrl: string, environment: string, testType: string }} data
 */
export function runBulkCreateUpdateIteration(data) {
  const bulkUploadId = uuidv4();
  const created = runBulkCreateIteration(data, bulkUploadId);
  if (!created) {
    return;
  }

  const updatePayload = generateBulkUpdatePayload(
    created.wasteTrackingIds,
    created.orgId,
    data.testType,
    vuIndex()
  );

  const updateRes = bulkUpdateMovements(
    data.baseUrl,
    data.serviceAuthToken,
    data.apiKey,
    bulkUploadId,
    updatePayload,
    {
      environment: data.environment,
      name: 'Bulk Update Waste Movement',
      testType: data.testType,
    }
  );

  const updateOk = check(updateRes, {
    'bulk update status is 200': (r) => r.status === 200,
  });

  if (!updateOk) {
    console.error(`Bulk update failed: ${updateRes.status} ${updateRes.body}`);
  }

  thinkTime();
}
