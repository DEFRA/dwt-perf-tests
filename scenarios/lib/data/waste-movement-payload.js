/**
 * Waste movement create/update payloads for the external-api profile.
 */

/**
 * Format timestamp as yyyy-MM-dd'T'HH:mm:ss.SSS'Z'
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
 * Shared body used by create and update payloads.
 * @param {string} apiCode
 * @param {string} wasteDescription1
 * @param {string} wasteDescription2
 * @returns {Object}
 */
function buildWasteMovementBody(apiCode, wasteDescription1, wasteDescription2) {
  return {
    apiCode,
    dateTimeReceived: formatTimestamp(),
    reasonForNoConsignmentCode: 'NO_DOC_WITH_WASTE',
    wasteItems: [
      {
        ewcCodes: ['200121'],
        wasteDescription: wasteDescription1,
        physicalForm: 'Mixed',
        numberOfContainers: 15,
        typeOfContainers: 'SKI',
        weight: {
          metric: 'Tonnes',
          amount: 1.2,
          isEstimate: true,
        },
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
            weight: {
              metric: 'Tonnes',
              amount: 0.75,
              isEstimate: false,
            },
          },
        ],
      },
      {
        ewcCodes: ['150110'],
        wasteDescription: wasteDescription2,
        physicalForm: 'Solid',
        numberOfContainers: 5,
        typeOfContainers: 'SKI',
        weight: {
          metric: 'Tonnes',
          amount: 1.1,
          isEstimate: true,
        },
        containsPops: false,
        pops: {
          sourceOfComponents: 'NOT_PROVIDED',
        },
        containsHazardous: true,
        hazardous: {
          hazCodes: ['HP_6'],
          sourceOfComponents: 'PROVIDED_WITH_WASTE',
          components: [{ name: 'Arsenic', concentration: 75 }],
        },
        disposalOrRecoveryCodes: [
          {
            code: 'R1',
            weight: {
              metric: 'Tonnes',
              amount: 0.75,
              isEstimate: false,
            },
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
 * Payload for POST /movements/receive.
 * @param {string} apiCode
 * @param {string} testType - e.g. Load, Stress, Spike, Baseline
 * @param {number|string} vuIndex - 0-based VU index (vu.idInTest - 1)
 * @returns {Object}
 */
export function generateCreateWasteMovementPayload(apiCode, testType, vuIndex) {
  const wasteDescription1 = `Create Waste Movement: ${testType} - ${vuIndex} - Primary waste containing industrial waste and hazardous heavy metals`;
  const wasteDescription2 = `Create Waste Movement: ${testType} - ${vuIndex} - Secondary waste containing plastic packaging and minor contaminants`;
  return buildWasteMovementBody(apiCode, wasteDescription1, wasteDescription2);
}

/**
 * Payload for PUT /movements/{id}/receive.
 * @param {string} apiCode
 * @param {string} testType
 * @param {number|string} vuIndex - 0-based VU index (vu.idInTest - 1)
 * @returns {Object}
 */
export function generateUpdateWasteMovementPayload(apiCode, testType, vuIndex) {
  const wasteDescription1 = `Update Waste Movement: ${testType} - ${vuIndex} - Primary waste containing industrial waste and hazardous heavy metals`;
  const wasteDescription2 = `Update Waste Movement: ${testType} - ${vuIndex} - Secondary waste containing plastic packaging and minor contaminants`;
  return buildWasteMovementBody(apiCode, wasteDescription1, wasteDescription2);
}
