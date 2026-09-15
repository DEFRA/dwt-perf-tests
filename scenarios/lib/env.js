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
