/**
 * k6 load options for the client-sync profile.
 *
 * Load and stress: 1m ramp to target VUs, then 9m hold (10m total).
 * Latency applies only to the measured GET client call. The catalogue
 * fetch is tagged separately and is not part of these thresholds.
 */

const GET_CLIENT_DURATION = 'http_req_duration{name:Get Client}';

const THRESHOLDS_MS = {
  baseline: 2000,
  load: 3000,
  stress: 5000,
  spike: 8000,
};

/**
 * @param {number} thresholdMs
 * @returns {Record<string, string[]>}
 */
function thresholds(thresholdMs) {
  return {
    [GET_CLIENT_DURATION]: [`max<${thresholdMs}`],
    checks: ['rate>0.99'],
  };
}

/**
 * 1 VU, 1 iteration, max < 2000ms.
 * @param {Record<string, string>} [tags]
 */
export function clientSyncBaselineOptions(tags = {}) {
  return {
    vus: 1,
    iterations: 1,
    thresholds: thresholds(THRESHOLDS_MS.baseline),
    tags,
  };
}

/**
 * 50 VUs, 1m ramp + 9m hold, max < 3000ms.
 * @param {Record<string, string>} [tags]
 */
export function clientSyncLoadOptions(tags = {}) {
  return {
    stages: [
      { duration: '1m', target: 50 },
      { duration: '9m', target: 50 },
    ],
    thresholds: thresholds(THRESHOLDS_MS.load),
    tags,
  };
}

/**
 * 100 VUs, 1m ramp + 9m hold, max < 5000ms.
 * @param {Record<string, string>} [tags]
 */
export function clientSyncStressOptions(tags = {}) {
  return {
    stages: [
      { duration: '1m', target: 100 },
      { duration: '9m', target: 100 },
    ],
    thresholds: thresholds(THRESHOLDS_MS.stress),
    tags,
  };
}

/**
 * Spike: 10 VUs (30s ramp + 150s hold), then 75 (5s + 175s), then 10 (10s + 170s).
 * Max < 8000ms.
 * @param {Record<string, string>} [tags]
 */
export function clientSyncSpikeOptions(tags = {}) {
  return {
    scenarios: {
      spike_phase_1_low: {
        executor: 'ramping-vus',
        startTime: '0s',
        gracefulRampDown: '0s',
        stages: [
          { duration: '30s', target: 10 },
          { duration: '150s', target: 10 },
        ],
      },
      spike_phase_2_high: {
        executor: 'ramping-vus',
        startTime: '180s',
        gracefulRampDown: '0s',
        stages: [
          { duration: '5s', target: 75 },
          { duration: '175s', target: 75 },
        ],
      },
      spike_phase_3_recovery: {
        executor: 'ramping-vus',
        startTime: '360s',
        gracefulRampDown: '0s',
        stages: [
          { duration: '10s', target: 10 },
          { duration: '170s', target: 10 },
        ],
      },
    },
    thresholds: thresholds(THRESHOLDS_MS.spike),
    tags,
  };
}
