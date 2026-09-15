#!/bin/sh
# CDP / Docker entrypoint.
# PROFILE=external-api runs all 8 scenarios sequentially.

set -eu

echo "run_id: ${RUN_ID:-local} in ${ENVIRONMENT:-unset}"

if [ -n "${CDP_HTTP_PROXY:-}" ]; then
  export HTTP_PROXY="$CDP_HTTP_PROXY"
  export HTTPS_PROXY="${CDP_HTTPS_PROXY:-$CDP_HTTP_PROXY}"
  export NO_PROXY=".cdp-int.defra.cloud"
fi

if [ -z "${PROFILE:-}" ]; then
  echo "PROFILE is not set. Set PROFILE=external-api"
  exit 1
fi

PROFILE=$(echo "$PROFILE" | tr '[:upper:]' '[:lower:]')

if [ "$PROFILE" != "external-api" ]; then
  echo "Unknown PROFILE: $PROFILE (only external-api is supported)"
  exit 1
fi

mkdir -p /reports
rm -f /reports/metrics.json /reports/index.html /reports/*.html /reports/metrics-*.json /reports/suite-status.txt

SCRIPTS="
scenarios/external-api/create/baseline.js
scenarios/external-api/create/load.js
scenarios/external-api/create/spike.js
scenarios/external-api/create/stress.js
scenarios/external-api/update/baseline.js
scenarios/external-api/update/load.js
scenarios/external-api/update/spike.js
scenarios/external-api/update/stress.js
"

SUITE_EXIT=0
: > /reports/metrics.json
: > /reports/suite-status.txt

# k6 built-in HTML report with graphs (export-only, no live UI)
export K6_WEB_DASHBOARD=true
export K6_WEB_DASHBOARD_PORT=-1
export K6_WEB_DASHBOARD_PERIOD="${K6_WEB_DASHBOARD_PERIOD:-1s}"

echo "Running profile: $PROFILE (8 scenarios)"

for script in $SCRIPTS; do
  name=$(echo "$script" | sed 's|scenarios/external-api/||; s|/|-|g; s|\.js||')
  metrics_file="/reports/metrics-${name}.json"
  report_file="/reports/${name}.html"

  echo ""
  echo "========================================"
  echo "Running: $script"
  echo "HTML report: $report_file"
  echo "========================================"

  export K6_WEB_DASHBOARD_EXPORT="$report_file"

  set +e
  k6 run --out "json=${metrics_file}" "$script"
  k6_exit=$?
  set -e

  if [ -f "$metrics_file" ]; then
    cat "$metrics_file" >> /reports/metrics.json
  fi

  if [ -f "$report_file" ]; then
    report_link="${name}.html"
  else
    report_link=""
    echo "WARNING: k6 HTML report was not generated for ${name} (run may have been too short)"
  fi

  if [ "$k6_exit" -ne 0 ]; then
    echo "FAILED|${name}|${report_link}" | tee -a /reports/suite-status.txt
    SUITE_EXIT=1
  else
    echo "PASSED|${name}|${report_link}" | tee -a /reports/suite-status.txt
  fi
done

# Portal landing page linking to each k6 graph report
{
  echo '<!DOCTYPE html>'
  echo '<html lang="en"><head><meta charset="UTF-8">'
  echo "<title>k6 Report: ${PROFILE}</title>"
  echo '<style>
    body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;margin:24px;background:#f5f5f5;color:#333}
    .wrap{max-width:900px;margin:0 auto;background:#fff;padding:24px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,.08)}
    h1{border-bottom:3px solid #3498db;padding-bottom:8px}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    th,td{padding:10px 12px;border-bottom:1px solid #eee;text-align:left}
    th{background:#3498db;color:#fff}
    .pass{color:#27ae60;font-weight:700}
    .fail{color:#e74c3c;font-weight:700}
    .meta{color:#888;font-size:14px}
  </style></head><body><div class="wrap">'
  echo "<h1>k6 Performance Reports: ${PROFILE}</h1>"
  echo "<p class=\"meta\">run_id: ${RUN_ID:-local} &middot; environment: ${ENVIRONMENT:-unset} &middot; generated: $(date -u '+%Y-%m-%d %H:%M:%S UTC')</p>"
  echo '<p>Each scenario has a standard k6 HTML report with graphs.</p>'
  echo '<table><thead><tr><th>Scenario</th><th>Status</th><th>Report</th></tr></thead><tbody>'

  while IFS='|' read -r status name report_link; do
    [ -z "$status" ] && continue
    if [ "$status" = "PASSED" ]; then
      cls="pass"
    else
      cls="fail"
    fi
    if [ -n "$report_link" ] && [ -f "/reports/${report_link}" ]; then
      link_html="<a href=\"${report_link}\">${report_link}</a>"
    else
      link_html="<span class=\"meta\">(not generated)</span>"
    fi
    echo "<tr><td><strong>${name}</strong></td><td class=\"${cls}\">${status}</td><td>${link_html}</td></tr>"
  done < /reports/suite-status.txt

  echo '</tbody></table>'
  echo '<p class="meta"><a href="metrics.json">Download combined raw metrics (JSON)</a></p>'
  echo '</div></body></html>'
} > /reports/index.html

# Publish results to S3 for CDP Portal
if [ -n "${RESULTS_OUTPUT_S3_PATH:-}" ]; then
  if [ ! -f /reports/index.html ]; then
    echo "index.html not found"
    exit 1
  fi

  aws --endpoint-url="${S3_ENDPOINT}" s3 cp /reports/index.html "$RESULTS_OUTPUT_S3_PATH/index.html"
  aws --endpoint-url="${S3_ENDPOINT}" s3 cp /reports/metrics.json "$RESULTS_OUTPUT_S3_PATH/metrics.json"

  for f in /reports/*.html; do
    [ -f "$f" ] || continue
    base=$(basename "$f")
    [ "$base" = "index.html" ] && continue
    aws --endpoint-url="${S3_ENDPOINT}" s3 cp "$f" "$RESULTS_OUTPUT_S3_PATH/$base"
  done

  echo "Reports published to $RESULTS_OUTPUT_S3_PATH"
fi

if [ "$SUITE_EXIT" -ne 0 ]; then
  echo "K6 REPORTED FAILURES, EXITING NON-ZERO"
  exit 1
fi

echo "external-api suite completed successfully"
