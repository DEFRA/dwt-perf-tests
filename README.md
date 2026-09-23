# dwt-perf-tests

k6 performance tests for Digital Waste Tracking, designed to run on the CDP Platform.

## Overview

This suite ports legacy JMeter profiles. Set `PROFILE` to choose which tests run.

## Technology Stack

- **Grafana k6** for load testing and performance measurement
- **Docker** image based on `grafana/k6` with AWS CLI for CDP Portal S3 report publishing

## Test Coverage

| Profile | Description |
|---------|-------------|
| `external-api` | Public API: create + update movements under baseline, load, spike, and stress (8 scenarios) |
| `nfr-cap-10` | Capacity NFR: 300 VUs, 5m ramp + 25m hold; every iteration creates, ~10% of VUs also update |
| `bulk-upload` | Backend bulk API: create + create/update with **250** movements per request; baseline 1 / load 2 / stress 3 VUs; spike 1→3→1 (8 scenarios) |

Scripts live under `scenarios/{profile}/`. Shared helpers are in `scenarios/lib/`.

### Pass / fail

- **`external-api`:** each scenario fails if any request exceeds that shape’s max latency threshold, or if check pass rate is ≤ 99%.
- **`nfr-cap-10`:** fails if more than 1% of requests take ≥ 5s (`p(99)<5000`), or if check pass rate is ≤ 99%. Checks are create **201** + `wasteTrackingId`, and update **200** where update runs.
- **`bulk-upload`:** fails if any request exceeds **30s**, or if check pass rate is ≤ 99%. Create expects **201**, first `wasteTrackingId`, and **250** movements; update expects **200**.

### Reports

Each scenario exports a k6 HTML dashboard with graphs. Use `reports/index.html` for pass/fail status; open the linked per-scenario HTML files for latency/VU graphs only (they do not highlight threshold failure).

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `PROFILE` | Yes | `external-api`, `nfr-cap-10`, or `bulk-upload` |
| `ENVIRONMENT` | Yes | Target CDP env: `local`, `dev`, `test`, `perf-test`, or `ext-test` |
| `COGNITO_CLIENT_ID` | For external-api / nfr-cap-10 | Cognito app client id |
| `COGNITO_CLIENT_SECRET` | For external-api / nfr-cap-10 | Cognito app client secret |
| `COGNITO_OAUTH_BASE_URL` | For external-api / nfr-cap-10 | Cognito domain (no trailing slash) |
| `API_CODE` | For external-api / nfr-cap-10 | Organisation API code for single-movement receive |
| `SERVICE_AUTH_WASTE_ORGANISATION_BACKEND` | For bulk-upload | Basic auth token (value after `Basic `, same as JMeter) |
| `CDP_API_KEY` | For bulk-upload (non-local) | CDP API key header |
| `CI` | No | `true` on CDP for direct backend URL; omit/false for local/ephemeral gateway |
| `WASTE_MOVEMENT_EXTERNAL_API_BASE_URL` | No | Override public API base URL |
| `WASTE_MOVEMENT_BACKEND_BASE_URL` | No | Override backend base URL |
| `RUN_ID` | No | Run identifier (CDP sets this; local default `local`) |

Copy `.env.example` to `.env` for local runs. CDP Portal injects secrets/env at runtime.

## Running Tests

### Via CDP Portal

1. Navigate to **Test Suites** in the CDP Portal
2. Select this suite and set `PROFILE` plus the secrets for that profile
3. Execute against the target environment
4. Open the HTML reports from the portal when the run finishes

Start with `index.html` for pass/fail; use the linked scenario reports for graphs.

### Locally with Docker

**Prerequisites:** Docker

```bash
cp .env.example .env
# fill in values for the profile you will run

PROFILE=external-api ./run-perf-test.sh
# or
PROFILE=nfr-cap-10 ./run-perf-test.sh
# or
PROFILE=bulk-upload ./run-perf-test.sh
```

Reports are written to `./reports/` on the host (`index.html` for pass/fail, per-scenario HTML for graphs).

### Build only

```bash
docker build -t dwt-perf-tests .
```

## Build / publish (CDP)

On push to `main`, [.github/workflows/publish.yml](.github/workflows/publish.yml) builds and publishes the Docker image via `DEFRA/cdp-build-action/build@main`.

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government licence v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable
information providers in the public sector to license the use and re-use of their information under a common open
licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
