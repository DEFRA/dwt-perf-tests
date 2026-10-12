/**
 * k6 load options for PROFILE=e2e.
 *
 * 1000 VUs, 300s ramp, 1200s total duration (incl. ramp) → 5m ramp + 15m hold.
 * Duration assert: max 8000 ms.
 */

export const E2E_THRESHOLD_MS = 8000;
export const E2E_VUS = 1000;

/**
 * @param {Record<string, string>} [tags]
 */
export function e2ePerfOptions(tags = {}) {
  return {
    stages: [
      { duration: '5m', target: E2E_VUS },
      { duration: '15m', target: E2E_VUS },
    ],
    thresholds: {
      http_req_duration: [`max<${E2E_THRESHOLD_MS}`],
      checks: ['rate>0.99'],
    },
    tags,
  };
}
