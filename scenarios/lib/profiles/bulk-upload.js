/**
 * k6 load options for PROFILE=bulk-upload.
 *
 * JMeter shapes: baseline 1 VU; load 2 VUs; stress 3 VUs; spike 1→3→1.
 * All shapes: duration assert 30000 ms.
 */

import {
  baselineOptions,
  loadOrStressOptions,
} from './external-api.js';

export const BULK_THRESHOLD_MS = 30000;

export const BULK_VUS = {
  baseline: 1,
  load: 2,
  stress: 3,
};

/**
 * @param {Record<string, string>} [tags]
 */
export function bulkBaselineOptions(tags = {}) {
  return baselineOptions(BULK_THRESHOLD_MS, tags);
}

/**
 * @param {number} vus
 * @param {Record<string, string>} [tags]
 */
export function bulkLoadOrStressOptions(vus, tags = {}) {
  return loadOrStressOptions(vus, BULK_THRESHOLD_MS, tags);
}

/**
 * Spike: 1 VU (30s ramp + 150s hold) → 3 VUs (5s + 175s) → 1 VU (10s + 170s).
 * @param {Record<string, string>} [tags]
 */
export function bulkSpikeOptions(tags = {}) {
  return {
    scenarios: {
      spike_phase_1_low: {
        executor: 'ramping-vus',
        startTime: '0s',
        gracefulRampDown: '0s',
        stages: [
          { duration: '30s', target: 1 },
          { duration: '150s', target: 1 },
        ],
      },
      spike_phase_2_high: {
        executor: 'ramping-vus',
        startTime: '180s',
        gracefulRampDown: '0s',
        stages: [
          { duration: '5s', target: 3 },
          { duration: '175s', target: 3 },
        ],
      },
      spike_phase_3_recovery: {
        executor: 'ramping-vus',
        startTime: '360s',
        gracefulRampDown: '0s',
        stages: [
          { duration: '10s', target: 1 },
          { duration: '170s', target: 1 },
        ],
      },
    },
    thresholds: {
      http_req_duration: [`max<${BULK_THRESHOLD_MS}`],
      checks: ['rate>0.99'],
    },
    tags,
  };
}
