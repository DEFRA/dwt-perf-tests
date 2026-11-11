/**
 * k6 options for the beta-2 profile.
 *
 * Two baselines, each 1 VU and 1 iteration.
 * with-delivery-id: movement, collection, delivery, then receipt.
 * without-delivery-id: POST /beta-2/receipts.
 * Each request uses the same max duration as the external-api baseline.
 */

import { baselineOptions, THRESHOLDS_MS } from './external-api.js';

export const BETA_2_BASELINE_THRESHOLD_MS = THRESHOLDS_MS.baseline;

/**
 * @param {Record<string, string>} [tags]
 */
export function beta2BaselineOptions(tags = {}) {
  return baselineOptions(BETA_2_BASELINE_THRESHOLD_MS, tags);
}
