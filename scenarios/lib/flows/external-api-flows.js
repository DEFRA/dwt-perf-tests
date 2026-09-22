import { check } from 'k6';
import { vu } from 'k6/execution';
import {
  generateCreateWasteMovementPayload,
  generateUpdateWasteMovementPayload,
} from '../data/waste-movement-payload.js';
import {
  receiveMovement,
  receiveMovementWithId,
} from '../api/waste-movement-api.js';
import { thinkTime } from '../think-time.js';

/**
 * 0-based VU index for payload descriptions (k6 vu.idInTest is 1-based).
 * @returns {number}
 */
export function vuIndex() {
  return vu.idInTest - 1;
}

/**
 * Create-only iteration (POST /movements/receive).
 * @param {{ accessToken: string, baseUrl: string, apiCode: string, environment: string, testType: string }} data
 * @returns {string|null} wasteTrackingId from the create response, or null on failure
 */
export function runCreateWasteMovementIteration(data) {
  const index = vuIndex();
  const payload = generateCreateWasteMovementPayload(
    data.apiCode,
    data.testType,
    index
  );

  const res = receiveMovement(data.baseUrl, data.accessToken, payload, {
    environment: data.environment,
    name: 'Create Waste Movement',
    testType: data.testType,
  });

  let wasteTrackingId = null;
  try {
    wasteTrackingId = res.json('wasteTrackingId');
  } catch (e) {
    wasteTrackingId = null;
  }

  const ok = check(res, {
    'create status is 201': (r) => r.status === 201,
    'create has wasteTrackingId': () => !!wasteTrackingId,
  });

  if (!ok) {
    console.error(`Create failed: ${res.status} ${res.body}`);
  }

  thinkTime();

  return wasteTrackingId;
}

/**
 * PUT /movements/{id}/receive after a successful create.
 * @param {{ accessToken: string, baseUrl: string, apiCode: string, environment: string, testType: string }} data
 * @param {string} wasteTrackingId
 */
function runUpdateWasteMovement(data, wasteTrackingId) {
  const index = vuIndex();
  const updatePayload = generateUpdateWasteMovementPayload(
    data.apiCode,
    data.testType,
    index
  );

  const updateRes = receiveMovementWithId(
    data.baseUrl,
    data.accessToken,
    wasteTrackingId,
    updatePayload,
    {
      environment: data.environment,
      name: 'Update Waste Movement',
      testType: data.testType,
    }
  );

  const updateOk = check(updateRes, {
    'update status is 200': (r) => r.status === 200,
  });

  if (!updateOk) {
    console.error(`Update failed: ${updateRes.status} ${updateRes.body}`);
  }

  thinkTime();
}

/**
 * Create then update iteration (POST then PUT /movements/{id}/receive).
 * Every iteration performs both requests.
 * @param {{ accessToken: string, baseUrl: string, apiCode: string, environment: string, testType: string }} data
 */
export function runCreateUpdateWasteMovementIteration(data) {
  const wasteTrackingId = runCreateWasteMovementIteration(data);
  if (!wasteTrackingId) {
    return;
  }

  runUpdateWasteMovement(data, wasteTrackingId);
}

/**
 * Create every iteration; update only when vuIndex % 10 === 0 (~10% of VUs).
 * @param {{ accessToken: string, baseUrl: string, apiCode: string, environment: string, testType: string }} data
 */
export function runCreatePartialUpdateWasteMovementIteration(data) {
  const wasteTrackingId = runCreateWasteMovementIteration(data);
  if (!wasteTrackingId) {
    return;
  }

  if (vuIndex() % 10 !== 0) {
    return;
  }
  // Create update movements 10% of the time, which is roughly the percentage of updates vs. creates in prod
  runUpdateWasteMovement(data, wasteTrackingId);
}
