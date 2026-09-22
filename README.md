# dwt-perf-tests

k6 performance tests for Digital Waste Tracking (waste-movement external API), designed to run on the CDP Platform.

## Overview

This suite ports legacy JMeter profiles for the waste-movement external API. Set `PROFILE` to choose which tests run.

## Technology Stack

- **Grafana k6** for load testing and performance measurement
- **Docker** image based on `grafana/k6` with AWS CLI for CDP Portal S3 report publishing

## Test Coverage

| Profile | Description |
|---------|-------------|
| `external-api` | Full suite: create + update movements under baseline, load, spike, and stress shapes (8 scenarios) |
| `nfr-cap-10` | Capacity NFR: 300 VUs, 5m ramp + 25m hold; every iteration creates, ~10% of VUs also update |

Scripts live under `scenarios/{profile}/`. Shared helpers are in `scenarios/lib/`.

### Pass / fail

- **`external-api`:** each scenario fails if any request exceeds that shape’s max latency threshold, or if check pass rate is ≤ 99%.
- **`nfr-cap-10`:** fails if more than 1% of requests take ≥ 5s (`p(99)<5000`), or if check pass rate is ≤ 99%. Checks are create **201** + `wasteTrackingId`, and update **200** where update runs.

### Reports

Each scenario exports a k6 HTML dashboard with graphs. Use `reports/index.html` for pass/fail status; open the linked per-scenario HTML files for latency/VU graphs only (they do not highlight threshold failure).

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `PROFILE` | Yes | `external-api` or `nfr-cap-10` |
| `ENVIRONMENT` | Yes | Target CDP env: `local`, `dev`, `test`, `perf-test`, or `ext-test` |
| `COGNITO_CLIENT_ID` | Yes | Cognito app client id |
| `COGNITO_CLIENT_SECRET` | Yes | Cognito app client secret |
| `COGNITO_OAUTH_BASE_URL` | Yes | Cognito domain (no trailing slash) |
| `API_CODE` | Yes | Organisation API code for `POST /movements/receive` |
| `WASTE_MOVEMENT_EXTERNAL_API_BASE_URL` | No | Override API base URL (defaults from `ENVIRONMENT`) |
| `RUN_ID` | No | Run identifier (CDP sets this; local default `local`) |

Copy `.env.example` to `.env` for local runs. CDP Portal injects secrets/env at runtime.

## Running Tests

### Via CDP Portal

1. Navigate to **Test Suites** in the CDP Portal
2. Select this suite and set `PROFILE` (`external-api` or `nfr-cap-10`) plus Cognito / `API_CODE` secrets
3. Execute against the target environment
4. Open the HTML reports from the portal when the run finishes

Start with `index.html` for pass/fail; use the linked scenario reports for graphs.

### Locally with Docker

**Prerequisites:** Docker

```bash
cp .env.example .env
# fill in Cognito + API_CODE values

PROFILE=external-api ./run-perf-test.sh
# or
PROFILE=nfr-cap-10 ./run-perf-test.sh
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
