/**
 * Bulk create/update payloads for PROFILE=bulk-upload (250 movements per request).
 */

export const BULK_MOVEMENT_COUNT = 250;

/**
 * @returns {string}
 */
function formatTimestamp() {
  const d = new Date();
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}` +
    `.${pad(d.getUTCMilliseconds(), 3)}Z`
  );
}

/**
 * @returns {string}
 */
export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * @param {string} orgId
 * @param {string} timestamp
 * @param {string} wasteDescription
 * @returns {Object}
 */
function bulkCreateMovement(orgId, timestamp, wasteDescription) {
  return {
    submittingOrganisation: {
      defraCustomerOrganisationId: orgId,
    },
    dateTimeReceived: timestamp,
    reasonForNoConsignmentCode: 'NO_DOC_WITH_WASTE',
    wasteItems: [
      {
        ewcCodes: ['150110'],
        wasteDescription,
        physicalForm: 'Solid',
        numberOfContainers: 5,
        typeOfContainers: 'SKI',
        weight: { metric: 'Tonnes', amount: 1.1, isEstimate: true },
        containsPops: false,
        pops: { sourceOfComponents: 'NOT_PROVIDED' },
        containsHazardous: true,
        hazardous: {
          hazCodes: ['HP_6'],
          sourceOfComponents: 'PROVIDED_WITH_WASTE',
          components: [{ name: 'Arsenic', concentration: 75 }],
        },
        disposalOrRecoveryCodes: [
          {
            code: 'R1',
            weight: { metric: 'Tonnes', amount: 0.75, isEstimate: false },
          },
        ],
      },
    ],
    carrier: {
      organisationName: 'Carrier Ltd',
      registrationNumber: 'CBDL999999',
      address: {
        fullAddress: '321 Test Street, Test City',
        postcode: 'TC2 2CD',
      },
      emailAddress: 'test@carrier.com',
      phoneNumber: '01234567890',
      meansOfTransport: 'Road',
      vehicleRegistration: 'AB12 CDE',
    },
    receiver: {
      siteName: 'Receiver Ltd',
      emailAddress: 'receiver@test.com',
      phoneNumber: '01234567890',
      authorisationNumber: 'PPC/A/SEPA9999-9999',
      regulatoryPositionStatements: [123, 456],
    },
    receipt: {
      address: {
        fullAddress: '123 Test Street, Test City',
        postcode: 'TC1 2AB',
      },
    },
  };
}

/**
 * @param {string} wasteTrackingId
 * @param {string} orgId
 * @param {string} timestamp
 * @param {string} description1
 * @param {string} description2
 * @returns {Object}
 */
function bulkUpdateMovement(
  wasteTrackingId,
  orgId,
  timestamp,
  description1,
  description2
) {
  return {
    wasteTrackingId,
    submittingOrganisation: {
      defraCustomerOrganisationId: orgId,
    },
    dateTimeReceived: timestamp,
    reasonForNoConsignmentCode: 'NO_DOC_WITH_WASTE',
    wasteItems: [
      {
        ewcCodes: ['200121'],
        wasteDescription: description1,
        physicalForm: 'Mixed',
        numberOfContainers: 15,
        typeOfContainers: 'SKI',
        weight: { metric: 'Tonnes', amount: 1.2, isEstimate: true },
        containsPops: true,
        pops: {
          sourceOfComponents: 'PROVIDED_WITH_WASTE',
          components: [
            { code: 'CHL', concentration: 250 },
            { code: 'TOX', concentration: 156.4 },
            { code: 'DCF', concentration: 0.8 },
            { code: 'DDT', concentration: 1.2 },
          ],
        },
        containsHazardous: true,
        hazardous: {
          hazCodes: ['HP_1', 'HP_3', 'HP_6'],
          sourceOfComponents: 'PROVIDED_WITH_WASTE',
          components: [
            { name: 'Mercury', concentration: 0.35 },
            { name: 'Arsenic', concentration: 300 },
            { name: 'Chromium', concentration: 0.42 },
            { name: 'Lead', concentration: 0.89 },
          ],
        },
        disposalOrRecoveryCodes: [
          {
            code: 'R1',
            weight: { metric: 'Tonnes', amount: 0.75, isEstimate: false },
          },
        ],
      },
      {
        ewcCodes: ['150110'],
        wasteDescription: description2,
        physicalForm: 'Solid',
        numberOfContainers: 5,
        typeOfContainers: 'SKI',
        weight: { metric: 'Tonnes', amount: 1.1, isEstimate: true },
        containsPops: false,
        pops: { sourceOfComponents: 'NOT_PROVIDED' },
        containsHazardous: true,
        hazardous: {
          hazCodes: ['HP_6'],
          sourceOfComponents: 'PROVIDED_WITH_WASTE',
          components: [{ name: 'Arsenic', concentration: 75 }],
        },
        disposalOrRecoveryCodes: [
          {
            code: 'R1',
            weight: { metric: 'Tonnes', amount: 0.75, isEstimate: false },
          },
        ],
      },
    ],
    carrier: {
      organisationName: 'Carrier Ltd',
      registrationNumber: 'CBDL999999',
      address: {
        fullAddress: '321 Test Street, Test City',
        postcode: 'TC2 2CD',
      },
      emailAddress: 'test@carrier.com',
      phoneNumber: '01234567890',
      meansOfTransport: 'Road',
      vehicleRegistration: 'AB12 CDE',
    },
    receiver: {
      siteName: 'Receiver Ltd',
      emailAddress: 'receiver@test.com',
      phoneNumber: '01234567890',
      authorisationNumber: 'PPC/A/SEPA9999-9999',
      regulatoryPositionStatements: [123, 456],
    },
    receipt: {
      address: {
        fullAddress: '123 Test Street, Test City',
        postcode: 'TC1 2AB',
      },
    },
  };
}

/**
 * @param {string} testType
 * @param {number|string} vuIndex
 * @param {number} [count]
 * @returns {{ orgId: string, movements: Object[] }}
 */
export function generateBulkCreatePayload(
  testType,
  vuIndex,
  count = BULK_MOVEMENT_COUNT
) {
  const orgId = uuidv4();
  const timestamp = formatTimestamp();
  const movements = [];
  for (let idx = 1; idx <= count; idx++) {
    movements.push(
      bulkCreateMovement(
        orgId,
        timestamp,
        `Bulk Create: ${testType} - ${vuIndex} - Movement ${idx} - Secondary waste containing plastic packaging and minor contaminants`
      )
    );
  }
  return { orgId, movements };
}

/**
 * @param {string[]} wasteTrackingIds
 * @param {string} orgId
 * @param {string} testType
 * @param {number|string} vuIndex
 * @returns {Object[]}
 */
export function generateBulkUpdatePayload(
  wasteTrackingIds,
  orgId,
  testType,
  vuIndex
) {
  const timestamp = formatTimestamp();
  const description1 = `Bulk Update: ${testType} - ${vuIndex} - Primary waste containing industrial waste and hazardous heavy metals`;
  const description2 = `Bulk Update: ${testType} - ${vuIndex} - Secondary waste containing plastic packaging and minor contaminants`;
  return wasteTrackingIds.map((id) =>
    bulkUpdateMovement(id, orgId, timestamp, description1, description2)
  );
}
