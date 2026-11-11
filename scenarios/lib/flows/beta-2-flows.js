import { check } from 'k6';
import {
  generateBeta2CollectionPayload,
  generateBeta2DeliveryPayload,
  generateBeta2MovementPayload,
  generateBeta2ReceiptPayload,
  generateBeta2ReceiptWithoutDeliveryIdPayload,
} from '../data/beta-2-payload.js';
import {
  createCollection,
  createDelivery,
  createMovement,
  createReceipt,
  createReceiptWithoutDeliveryId,
} from '../api/beta-2-api.js';
import { thinkTime } from '../think-time.js';

/**
 * @param {import('k6/http').RefinedResponse} res
 * @returns {Object|null}
 */
function readBody(res) {
  try {
    return res.json();
  } catch (e) {
    return null;
  }
}

/**
 * One non-hazardous journey: movement, collection, delivery, receipt with that delivery id.
 * Stops when a step does not return the id the next step needs.
 * @param {{ accessToken: string, baseUrl: string, apiCode: string, environment: string, testType: string }} data
 */
export function runBeta2JourneyIteration(data) {
  const tags = {
    environment: data.environment,
    testType: data.testType,
  };

  const movementRes = createMovement(
    data.baseUrl,
    data.accessToken,
    data.apiCode,
    generateBeta2MovementPayload(),
    { ...tags, name: 'Create Beta-2 Movement' }
  );
  const movementBody = readBody(movementRes);
  const movementId = movementBody && movementBody.data && movementBody.data.movementId;
  const movementOk = check(movementRes, {
    'movement status is 201': (r) => r.status === 201,
    'movement has movementId': () => !!movementId,
  });
  thinkTime();
  if (!movementOk || !movementId) {
    console.error(`Movement failed: ${movementRes.status} ${movementRes.body}`);
    return;
  }

  const collectionRes = createCollection(
    data.baseUrl,
    data.accessToken,
    data.apiCode,
    movementId,
    generateBeta2CollectionPayload(),
    { ...tags, name: 'Record Beta-2 Collection' }
  );
  const collectionOk = check(collectionRes, {
    'collection status is 201': (r) => r.status === 201,
  });
  thinkTime();
  if (!collectionOk) {
    console.error(`Collection failed: ${collectionRes.status} ${collectionRes.body}`);
    return;
  }

  const deliveryRes = createDelivery(
    data.baseUrl,
    data.accessToken,
    data.apiCode,
    generateBeta2DeliveryPayload([movementId]),
    { ...tags, name: 'Record Beta-2 Delivery' }
  );
  const deliveryBody = readBody(deliveryRes);
  const deliveries = deliveryBody && deliveryBody.data && deliveryBody.data.deliveries;
  const deliveryId = deliveries && deliveries[0] && deliveries[0].deliveryId;
  const deliveryOk = check(deliveryRes, {
    'delivery status is 201': (r) => r.status === 201,
    'delivery has deliveryId': () => !!deliveryId,
    'delivery id is not the movement id': () => !!deliveryId && deliveryId !== movementId,
  });
  thinkTime();
  if (!deliveryOk || !deliveryId) {
    console.error(`Delivery failed: ${deliveryRes.status} ${deliveryRes.body}`);
    return;
  }

  const receiptRes = createReceipt(
    data.baseUrl,
    data.accessToken,
    data.apiCode,
    deliveryId,
    generateBeta2ReceiptPayload(),
    { ...tags, name: 'Record Beta-2 Receipt' }
  );
  const receiptBody = readBody(receiptRes);
  const receiptDeliveryId = receiptBody && receiptBody.data && receiptBody.data.deliveryId;
  const receiptOk = check(receiptRes, {
    'receipt status is 201': (r) => r.status === 201,
    'receipt returns the delivery id': () => receiptDeliveryId === deliveryId,
  });
  thinkTime();
  if (!receiptOk) {
    console.error(`Receipt failed: ${receiptRes.status} ${receiptRes.body}`);
  }
}

/**
 * One receipt with no delivery id (POST /beta-2/receipts). The API mints the delivery id.
 * @param {{ accessToken: string, baseUrl: string, apiCode: string, environment: string, testType: string }} data
 */
export function runBeta2ReceiptWithoutDeliveryIdIteration(data) {
  const receiptRes = createReceiptWithoutDeliveryId(
    data.baseUrl,
    data.accessToken,
    data.apiCode,
    generateBeta2ReceiptWithoutDeliveryIdPayload(),
    {
      environment: data.environment,
      testType: data.testType,
      name: 'Record Beta-2 Receipt Without Delivery Id',
    }
  );
  const receiptBody = readBody(receiptRes);
  const deliveryId = receiptBody && receiptBody.data && receiptBody.data.deliveryId;
  const receiptOk = check(receiptRes, {
    'receipt status is 201': (r) => r.status === 201,
    'receipt mints a delivery id': () => !!deliveryId,
  });
  thinkTime();
  if (!receiptOk) {
    console.error(`Receipt without delivery id failed: ${receiptRes.status} ${receiptRes.body}`);
  }
}
