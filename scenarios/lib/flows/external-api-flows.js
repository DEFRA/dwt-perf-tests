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
 */
export function runCreateIteration(data) {
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

  const ok = check(res, {
    'create status is 201': (r) => r.status === 201,
    'create has wasteTrackingId': (r) => {
      try {
        return !!r.json('wasteTrackingId');
      } catch (e) {
        return false;
      }
    },
  });

  if (!ok) {
    console.error(`Create failed: ${res.status} ${res.body}`);
  }

  thinkTime();
}

/**
 * Create then update iteration (POST then PUT /movements/{id}/receive).
 * Every iteration performs both requests.
 * @param {{ accessToken: string, baseUrl: string, apiCode: string, environment: string, testType: string }} data
 */
export function runCreateUpdateIteration(data) {
  const index = vuIndex();
  const createPayload = generateCreateWasteMovementPayload(
    data.apiCode,
    data.testType,
    index
  );

  const createRes = receiveMovement(
    data.baseUrl,
    data.accessToken,
    createPayload,
    {
      environment: data.environment,
      name: 'Create Waste Movement',
      testType: data.testType,
    }
  );

  let wasteTrackingId = null;
  try {
    wasteTrackingId = createRes.json('wasteTrackingId');
  } catch (e) {
    wasteTrackingId = null;
  }

  const createOk = check(createRes, {
    'create status is 201': (r) => r.status === 201,
    'create has wasteTrackingId': () => !!wasteTrackingId,
  });

  if (!createOk) {
    console.error(`Create failed: ${createRes.status} ${createRes.body}`);
  }

  thinkTime();

  if (!wasteTrackingId) {
    return;
  }

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
