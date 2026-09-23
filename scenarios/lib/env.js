import { fail } from 'k6';

const ALLOWED_ENVIRONMENTS = ['local', 'dev', 'test', 'perf-test', 'ext-test'];

/**
 * Read an environment variable loaded into the process (e.g. via `source .env`).
 * @param {string} name
 * @returns {string}
 */
export function getEnv(name) {
  return __ENV[name] || '';
}

/**
 * @param {string} name
 * @returns {string}
 */
export function requireEnv(name) {
  const value = getEnv(name);
  if (!value || value === 'REPLACE_ME') {
    fail(
      `Missing required environment variable ${name}. Set it in CDP Portal secrets or source .env before ./run-perf-test.sh`
    );
  }
  return value;
}

/**
 * @returns {string} CDP environment name
 */
export function requireEnvironment() {
  const environment = requireEnv('ENVIRONMENT');
  if (ALLOWED_ENVIRONMENTS.indexOf(environment) === -1) {
    fail(
      `Unsupported ENVIRONMENT "${environment}". Expected one of: ${ALLOWED_ENVIRONMENTS.join(', ')}`
    );
  }
  return environment;
}
 
/**
 * External API base URL for the chosen ENVIRONMENT.
 * Default: https://waste-movement-external-api.api.{env}.cdp-int.defra.cloud
 * @param {string} [environment]
 * @returns {string}
 */
export function getExternalApiBaseUrl(environment = getEnv('ENVIRONMENT')) {
  const override = getEnv('WASTE_MOVEMENT_EXTERNAL_API_BASE_URL');
  if (override) {
    return override.replace(/\/$/, '');
  }
  if (environment === 'local') {
    return 'http://localhost:3001';
  }
  return `https://waste-movement-external-api.api.${environment}.cdp-int.defra.cloud`;
}

/**
 * Waste-movement backend base URL (bulk-upload profile).
 * Mirrors JMeter configure_waste_movement_backend_url.groovy:
 * - CI=true: https://waste-movement-backend.{env}.cdp-int.defra.cloud
 * - local: http://localhost:3002
 * - else: https://ephemeral-protected.api.{env}.cdp-int.defra.cloud/waste-movement-backend
 * @param {string} [environment]
 * @returns {string}
 */
export function getBackendBaseUrl(environment = getEnv('ENVIRONMENT')) {
  const override = getEnv('WASTE_MOVEMENT_BACKEND_BASE_URL');
  if (override) {
    return override.replace(/\/$/, '');
  }
  if (getEnv('CI') === 'true') {
    return `https://waste-movement-backend.${environment}.cdp-int.defra.cloud`;
  }
  if (environment === 'local') {
    return 'http://localhost:3002';
  }
  return `https://ephemeral-protected.api.${environment}.cdp-int.defra.cloud/waste-movement-backend`;
}
