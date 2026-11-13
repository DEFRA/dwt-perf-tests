/**
 * Beta-2 payloads for the non-hazardous journey:
 * movement, collection, delivery, receipt with the delivery id.
 * apiCode is sent as the x-api-code header, never in the body.
 * Field set matches the UAT base generators.
 */

const collectionDateTime = '2026-01-15T09:30:00Z';
const deliveryDateTime = '2026-10-14T11:00:00Z';
const receiptDateTime = '2026-10-14T09:30:00Z';

/**
 * @returns {Object}
 */
function collectionSite() {
  return {
    address: {
      fullAddress: '10 Industrial Way, Test City',
      postcode: 'TE1 2PQ',
    },
    contactDetails: {
      emailAddress: 'site@example.com',
    },
  };
}

/**
 * @returns {Object}
 */
function carrier() {
  return {
    organisationName: 'Carrier Demo Ltd',
    registrationNumber: 'CBDU123456',
    meansOfTransport: 'ROAD',
    vehicleRegistration: 'AB12 CDE',
    contactDetails: {
      emailAddress: 'carrier@example.com',
    },
  };
}

/**
 * @returns {Object}
 */
function receiver() {
  return {
    siteName: 'Receiver Site Ltd',
    authorisationNumber: 'EAS/P/123456',
    receiptAddress: {
      postcode: 'TE1 3RC',
    },
    contactDetails: {
      emailAddress: 'receiver@example.com',
    },
  };
}

/**
 * @returns {Object}
 */
function physicalDetails() {
  return {
    form: 'SOLID',
    containerType: 'DRU',
    containerCount: 4,
    totalWeight: {
      amount: 250.5,
      unit: 'KILOGRAMS',
      isEstimate: false,
    },
  };
}

/**
 * Household movement. Non-hazardous, so the delivery id is minted and is not the movement id.
 * @returns {Object}
 */
export function generateBeta2MovementPayload() {
  return {
    producer: {
      wasteSource: 'HOUSEHOLD',
    },
    collectionDateTime,
    collectionSite: collectionSite(),
    intendedCarriers: [carrier()],
    intendedReceivers: [receiver()],
    wasteItems: [
      {
        classification: {
          wasteDescription: 'Mixed municipal waste',
          ewcCodes: ['200301'],
          pops: { isPresent: false },
          hazardous: { isPresent: false },
        },
        physicalDetails: physicalDetails(),
      },
    ],
  };
}

/**
 * @returns {Object}
 */
export function generateBeta2CollectionPayload() {
  return {
    carrier: carrier(),
    isDutyOfCareConfirmed: true,
    collectionDateTime,
    collectionSite: collectionSite(),
  };
}

/**
 * @param {string[]} movementIds
 * @returns {Object}
 */
export function generateBeta2DeliveryPayload(movementIds) {
  return {
    movementIds,
    carrier: carrier(),
    deliveryDateTime,
    deliverySite: {
      organisationName: 'Receiver Site Ltd',
      address: {
        fullAddress: '3 Receiver Road, Test City',
        postcode: 'TE1 3RC',
      },
    },
  };
}

/**
 * @returns {Object}
 */
export function generateBeta2ReceiptPayload() {
  return {
    receiptDateTime,
    carrier: carrier(),
    receiver: receiver(),
    physicalDetails: physicalDetails(),
    treatments: [treatment()],
  };
}

/**
 * POST /beta-2/receipts. No delivery id is sent. The API mints one.
 * @returns {Object}
 */
export function generateBeta2ReceiptWithoutDeliveryIdPayload() {
  return {
    reasonForNoDeliveryId:
      'No delivery was recorded prior to receipt; waste received directly from the producer.',
    receiptDateTime,
    carrier: carrier(),
    receiver: receiver(),
    wasteItems: [
      {
        classification: {
          wasteDescription: 'Mixed municipal waste',
          ewcCodes: ['200301'],
          pops: { isPresent: false },
          hazardous: { isPresent: false },
        },
        physicalDetails: physicalDetails(),
        treatments: [treatment()],
      },
    ],
  };
}

/**
 * @returns {Object}
 */
function treatment() {
  return {
    disposalOrRecoveryCode: 'R3',
    weight: {
      amount: 250.5,
      unit: 'KILOGRAMS',
      isEstimate: false,
    },
  };
}
