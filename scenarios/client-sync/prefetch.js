import { setupClientSyncTest } from '../lib/setup/client-sync-setup.js';

export const options = {
  vus: 1,
  iterations: 1,
};

export function setup() {
  return setupClientSyncTest('Catalogue');
}

export default function (data) {
  data.clientIds.forEach((clientId) => {
    console.log(`CLIENT_SYNC_ID ${clientId}`);
  });
}
