/**
 * k6 load options for the external-api profile.
 *
 * For load/stress: 1m ramp to target VUs, then 9m hold (10m total).
 */

/**
 * @param {number} thresholdMs
 * @param {Record<string, string>} [tags]
 */
export function baselineOptions(thresholdMs, tags = {}) {
  return {
    vus: 1,
    iterations: 1,
    thresholds: {
      http_req_duration: [`max<${thresholdMs}`],
      checks: ['rate>0.99'],
    },
    tags,
  };
}

/**
 * @param {number} vus
 * @param {number} thresholdMs
 * @param {Record<string, string>} [tags]
 */
export function loadOrStressOptions(vus, thresholdMs, tags = {}) {
  return {
    stages: [
      { duration: '1m', target: vus },
      { duration: '9m', target: vus },
    ],
    thresholds: {
      http_req_duration: [`max<${thresholdMs}`],
      checks: ['rate>0.99'],
    },
    tags,
  };
}

/**
 * Three sequential spike phases:
 * Phase 1: 10 VUs, ramp 30s, hold to 180s total
 * Phase 2: 75 VUs, ramp 5s, hold to 180s total
 * Phase 3: 10 VUs, ramp 10s, hold to 180s total
 *
 * @param {number} thresholdMs
 * @param {Record<string, string>} [tags]
 */
export function spikeOptions(thresholdMs, tags = {}) {
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
    thresholds: {
      http_req_duration: [`max<${thresholdMs}`],
      checks: ['rate>0.99'],
    },
    tags,
  };
}

export const THRESHOLDS_MS = {
  baseline: 2000,
  load: 3000,
  stress: 5000,
  spike: 8000,
};
