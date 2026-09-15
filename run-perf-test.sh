#!/usr/bin/env bash
# Local Docker helper.
# Usage:
#   set -a && source .env && set +a
#   PROFILE=external-api ./run-perf-test.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ -z "${PROFILE:-}" ]; then
  echo "PROFILE is not set. Run e.g. PROFILE=external-api ./run-perf-test.sh"
  exit 1
fi

# Optional: load .env if present and vars not already exported
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source <(sed '1s/^\xEF\xBB\xBF//' .env)
  set +a
fi

IMAGE_NAME="${IMAGE_NAME:-dwt-perf-tests}"

docker build -t "$IMAGE_NAME" .

mkdir -p reports

MSYS_NO_PATHCONV=1 docker run --rm \
  -v "$(pwd)/reports:/reports" \
  -e PROFILE="$PROFILE" \
  -e ENVIRONMENT="${ENVIRONMENT:-}" \
  -e COGNITO_CLIENT_ID="${COGNITO_CLIENT_ID:-}" \
  -e COGNITO_CLIENT_SECRET="${COGNITO_CLIENT_SECRET:-}" \
  -e COGNITO_OAUTH_BASE_URL="${COGNITO_OAUTH_BASE_URL:-}" \
  -e API_CODE="${API_CODE:-}" \
  -e WASTE_MOVEMENT_EXTERNAL_API_BASE_URL="${WASTE_MOVEMENT_EXTERNAL_API_BASE_URL:-}" \
  -e RUN_ID="${RUN_ID:-local}" \
  "$IMAGE_NAME"
