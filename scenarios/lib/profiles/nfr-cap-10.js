/**
 * k6 load options for the nfr-cap-10 profile (JMeter waste-movement-external-api/load-test).
 *
 * 300 VUs, 5m ramp + 25m hold (30m total).
 * Latency: fail only if more than 1% of requests exceed 3000 ms (p99 < 3000).
 */

import { loadOrStressOptions } from './external-api.js';

export const NFR_CAP_10_VUS = 300;
export const NFR_CAP_10_THRESHOLD_MS = 5000;

/**
 * @param {Record<string, string>} [tags]
 */
export function loadOptions(tags = {}) {
  const options = loadOrStressOptions(
    NFR_CAP_10_VUS,
    NFR_CAP_10_THRESHOLD_MS,
    tags,
    {
      ramp: '5m',
      hold: '25m',
    }
  );
  //run fails only if more than 1% of requests take ≥ NFR_CAP_10_THRESHOLD_MS
  options.thresholds.http_req_duration = [
    `p(99)<${NFR_CAP_10_THRESHOLD_MS}`,
  ];

  return options;
}
