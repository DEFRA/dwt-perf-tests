import { getEnv, requireEnvironment } from '../env.js';

/**
 * Hosts and auth for PROFILE=e2e.
 * @returns {{
 *   environment: string,
 *   frontendHost: string,
 *   defraStubHost: string,
 *   backendHost: string,
 *   cdpApiKey: string,
 *   backendBasicAuth: string,
 * }}
 */
export function setupE2eTest() {
  const environment = requireEnvironment();
  const frontendHost = `waste-organisation-frontend.${environment}.cdp-int.defra.cloud`;
  const defraStubHost = `cdp-defra-id-stub.${environment}.cdp-int.defra.cloud`;
  const backendOverride = getEnv('ORG_BACKEND_SERVICE_ENDPOINT');
  const backendHost =
    backendOverride ||
    `waste-organisation-backend.${environment}.cdp-int.defra.cloud`;

  console.log(`e2e Load — environment: ${environment}`);
  console.log(`frontend: https://${frontendHost}`);
  console.log(`stub: https://${defraStubHost}`);
  console.log(`backend: https://${backendHost}`);

  return {
    environment,
    frontendHost,
    defraStubHost,
    backendHost,
    cdpApiKey: getEnv('CDP_API_KEY'),
    backendBasicAuth: getEnv('SERVICE_AUTH_WASTE_MOVEMENT_EXTERNAL_API'),
  };
}
