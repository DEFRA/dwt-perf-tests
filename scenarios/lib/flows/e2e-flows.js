import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { scenario, vu } from 'k6/execution';
import { E2E_THRESHOLD_MS } from '../profiles/e2e.js';

/** Binary spreadsheet used by the UI upload journey. */
const uploadFileBytes = open('../../e2e/data/Test1-no-errors-500WM.xlsx', 'b');

const apiCodes = new SharedArray('e2e-api-codes', () =>
  open('../../e2e/data/apiCodes.csv')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
);

/**
 * Pause 15–60s before each request (e2e profile think time).
 */
function thinkTime() {
  sleep((15000 + Math.random() * 45000) / 1000);
}

/**
 * @param {import('k6/http').RefinedResponse} res
 * @param {number} expected
 * @param {string} name
 * @returns {boolean}
 */
function assertStatus(res, expected, name) {
  const ok = check(res, {
    [`${name} status is ${expected}`]: (r) => r.status === expected,
    [`${name} duration < ${E2E_THRESHOLD_MS}ms`]: (r) =>
      r.timings.duration < E2E_THRESHOLD_MS,
  });
  if (!ok) {
    console.error(
      `${name} failed: status=${res.status} duration=${res.timings.duration} body=${String(res.body).slice(0, 500)}`
    );
  }
  return ok;
}

/**
 * @param {string} url
 */
function clearCookiesForUrl(url) {
  const jar = http.cookieJar();
  const cookies = jar.cookiesForURL(url);
  for (const name of Object.keys(cookies)) {
    jar.set(url, name, '', { expires: 'Thu, 01 Jan 1970 00:00:00 GMT' });
  }
}

/**
 * @returns {string}
 */
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * @returns {string} yyyyMMddHHmmssSSS
 */
function timestampMs() {
  const d = new Date();
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}` +
    `${pad(d.getUTCMilliseconds(), 3)}`
  );
}

/**
 * @param {string} header
 * @param {string} name
 * @param {string} [fallback]
 * @returns {string}
 */
function queryParam(header, name, fallback = '') {
  if (!header) {
    return fallback;
  }
  const re = new RegExp(`[?&]${name}=([^&\\r\\n]+)`);
  const m = String(header).match(re);
  return m ? m[1] : fallback;
}

/**
 * Shared sequential api code from apiCodes.csv (recycles when exhausted): every
 * scenario iteration advances the cursor, including UI iterations that do not use it.
 * @returns {string}
 */
function nextApiCode() {
  return apiCodes[scenario.iterationInTest % apiCodes.length];
}

/**
 * Direct API branch (90% of VUs): GET organisation by api code.
 * @param {{ backendHost: string, cdpApiKey: string, backendBasicAuth: string, environment: string }} data
 * @param {string} code
 */
function runDirectApi(data, code) {
  thinkTime();
  const path = (data.cdpApiKey || '').trim()
    ? `/waste-organisation-backend/organisation/${code}`
    : `/organisation/${code}`;
  const res = http.get(`https://${data.backendHost}${path}`, {
    headers: {
      'content-type': 'application/json',
      'x-api-key': data.cdpApiKey || '',
      authorization: `Basic ${data.backendBasicAuth || ''}`,
    },
    tags: {
      environment: data.environment,
      name: 'GET /organisation/apiCode',
      segment: 'direct_api',
    },
    timeout: '60s',
  });
  assertStatus(res, 200, 'GET /organisation/apiCode');
}

/**
 * @param {{ frontendHost: string, defraStubHost: string, environment: string }} data
 * @param {{ defraUser: string, expireHref: string }} state
 */
function runUiLogin(data, state) {
  const frontend = `https://${data.frontendHost}`;
  const stub = `https://${data.defraStubHost}`;

  // 01 GET /
  thinkTime();
  let res = http.get(`${frontend}/`, {
    tags: { name: '01 GET /', segment: 'main_journey' },
    timeout: '60s',
  });
  assertStatus(res, 200, '01 GET /');

  // 02 POST / isPermit=yes — do not follow redirects (assert 302)
  thinkTime();
  res = http.post(`${frontend}/`, { isPermit: 'yes' }, {
    redirects: 0,
    tags: { name: '02 POST / (isPermit=yes)', segment: 'main_journey' },
    timeout: '60s',
  });
  assertStatus(res, 302, '02 POST / (isPermit=yes)');

  // 03 GET /signin-oidc — assert 302, extract OAuth params from Location
  thinkTime();
  res = http.get(`${frontend}/signin-oidc`, {
    redirects: 0,
    tags: { name: '03 GET /signin-oidc', segment: 'main_journey' },
    timeout: '60s',
  });
  assertStatus(res, 302, '03 GET /signin-oidc');
  const loc03 = res.headers.Location || res.headers.location || '';
  let serviceId = queryParam(loc03, 'serviceId') || queryParam(loc03, 'service_id');
  let responseType = queryParam(loc03, 'response_type', 'code');
  let forceReselection = queryParam(loc03, 'forceReselection', 'true') ||
    queryParam(loc03, 'force_reselection', 'true');
  let clientId = queryParam(loc03, 'client_id');
  let redirectUri = queryParam(
    loc03,
    'redirect_uri',
    encodeURIComponent(`${frontend}/signin-oidc`)
  );
  let stateParam = queryParam(loc03, 'state');
  let scope = queryParam(loc03, 'scope', encodeURIComponent('openid offline_access'));
  let codeChallenge = queryParam(loc03, 'code_challenge');
  let codeChallengeMethod = queryParam(loc03, 'code_challenge_method', 'S256');

  // 04 GET stub authorize (no user)
  thinkTime();
  const authQs = [
    `serviceId=${encodeURIComponent(serviceId)}`,
    `response_type=${encodeURIComponent(responseType)}`,
    `forceReselection=${encodeURIComponent(forceReselection)}`,
    `client_id=${encodeURIComponent(clientId)}`,
    `redirect_uri=${redirectUri}`,
    `state=${stateParam}`,
    `scope=${scope}`,
    `code_challenge=${encodeURIComponent(codeChallenge)}`,
    `code_challenge_method=${encodeURIComponent(codeChallengeMethod)}`,
  ].join('&');
  res = http.get(`${stub}/cdp-defra-id-stub/authorize?${authQs}`, {
    tags: { name: '04 GET stub authorize (no user)', segment: 'main_journey' },
    timeout: '60s',
  });
  assertStatus(res, 200, '04 GET stub authorize (no user)');
  // Re-extract from final request URL if redirects changed params
  const reqUrl = res.url || '';
  serviceId = queryParam(reqUrl, 'serviceId', serviceId);
  responseType = queryParam(reqUrl, 'response_type', responseType);
  forceReselection = queryParam(reqUrl, 'forceReselection', forceReselection);
  clientId = queryParam(reqUrl, 'client_id', clientId);
  redirectUri = queryParam(reqUrl, 'redirect_uri', redirectUri);
  stateParam = queryParam(reqUrl, 'state', stateParam);
  scope = queryParam(reqUrl, 'scope', scope);
  codeChallenge = queryParam(reqUrl, 'code_challenge', codeChallenge);
  codeChallengeMethod = queryParam(
    reqUrl,
    'code_challenge_method',
    codeChallengeMethod
  );

  // 05 GET stub authorize (with user) — assert 302
  // Encode redirect_uri/state as-is (double-encode when still percent-encoded from
  // Location); leave scope and user unencoded.
  thinkTime();
  const authQsUser = [
    `serviceId=${encodeURIComponent(serviceId)}`,
    `response_type=${encodeURIComponent(responseType)}`,
    `forceReselection=${encodeURIComponent(forceReselection)}`,
    `client_id=${encodeURIComponent(clientId)}`,
    `redirect_uri=${encodeURIComponent(redirectUri)}`,
    `state=${encodeURIComponent(stateParam)}`,
    `scope=${scope}`,
    `code_challenge=${encodeURIComponent(codeChallenge)}`,
    `code_challenge_method=${encodeURIComponent(codeChallengeMethod)}`,
    `user=${state.defraUser}`,
  ].join('&');
  res = http.get(`${stub}/cdp-defra-id-stub/authorize?${authQsUser}`, {
    redirects: 0,
    tags: { name: '05 GET stub authorize (with user)', segment: 'main_journey' },
    timeout: '60s',
  });
  assertStatus(res, 302, '05 GET stub authorize (with user)');
  const loc05 = res.headers.Location || res.headers.location || '';
  // Auth code from sessionId query param only (no code fallback)
  const authCode = queryParam(loc05, 'sessionId');

  // 06 GET stub organisations
  thinkTime();
  res = http.get(
    `${stub}/cdp-defra-id-stub/organisations?sessionId=${encodeURIComponent(authCode)}`,
    {
      tags: { name: '06 GET stub organisations', segment: 'main_journey' },
      timeout: '60s',
    }
  );
  assertStatus(res, 200, '06 GET stub organisations');
  const body06 = String(res.body || '');
  const orgMatch = body06.match(/Organisation ID:\s*([0-9a-fA-F-]{36})/);
  const organisationId = orgMatch ? orgMatch[1] : '';

  // 08 GET /signin-oidc with code+state
  thinkTime();
  res = http.get(
    `${frontend}/signin-oidc?code=${encodeURIComponent(authCode)}&state=${encodeURIComponent(stateParam)}`,
    {
      tags: { name: '08 GET /signin-oidc with code+state', segment: 'main_journey' },
      timeout: '60s',
    }
  );
  assertStatus(res, 200, '08 GET /signin-oidc with code+state');

  // 09 GET /account
  thinkTime();
  res = http.get(`${frontend}/account`, {
    tags: { name: '09 GET /account', segment: 'main_journey' },
    timeout: '60s',
  });
  assertStatus(res, 200, '09 GET /account');

  // 10 GET /next-action
  thinkTime();
  res = http.get(`${frontend}/next-action`, {
    tags: { name: '10 GET /next-action', segment: 'main_journey' },
    timeout: '60s',
  });
  assertStatus(res, 200, '10 GET /next-action');

  return organisationId;
}

/**
 * @param {{ frontendHost: string, environment: string }} data
 */
function runFrontendApiJourney(data) {
  const frontend = `https://${data.frontendHost}`;

  thinkTime();
  let res = http.post(
    `${frontend}/next-action`,
    { nextAction: 'connectYourSoftware' },
    {
      tags: { name: '11 POST /next-action', segment: 'api_page' },
      timeout: '60s',
    }
  );
  assertStatus(res, 200, '11 POST /next-action');

  thinkTime();
  res = http.get(`${frontend}/api`, {
    tags: { name: '12 GET /api', segment: 'api_page' },
    timeout: '60s',
  });
  assertStatus(res, 200, '12 GET /api');
}

/**
 * @param {{ frontendHost: string, environment: string }} data
 * @param {string} organisationId
 */
function runUploadJourney(data, organisationId) {
  const frontend = `https://${data.frontendHost}`;

  thinkTime();
  let res = http.post(
    `${frontend}/next-action`,
    { nextAction: 'uploadSpreadsheet' },
    {
      redirects: 0,
      tags: {
        name: '11 POST /next-action (uploadSpreadsheet)',
        segment: 'upload',
      },
      timeout: '60s',
    }
  );
  assertStatus(res, 302, '11 POST /next-action (uploadSpreadsheet)');

  thinkTime();
  res = http.get(
    `${frontend}/organisation/${organisationId}/spreadsheet/begin-upload`,
    {
      tags: { name: '12 GET begin-upload', segment: 'upload' },
      timeout: '60s',
    }
  );
  assertStatus(res, 200, '12 GET begin-upload');
  const formMatch = String(res.body || '').match(
    /<form[^>]*action="([^"]*\/upload-and-scan\/[^"]+)"/
  );
  let uploadAction = formMatch ? formMatch[1] : '/upload-and-scan/NOT_FOUND';
  if (uploadAction.startsWith('/')) {
    uploadAction = `${frontend}${uploadAction}`;
  }

  thinkTime();
  res = http.post(
    uploadAction,
    {
      fileUpload1: http.file(
        uploadFileBytes,
        'Test1-no-errors-500WM.xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ),
    },
    {
      redirects: 0,
      headers: {
        Origin: frontend,
        Referer: `${frontend}/organisation/${organisationId}/spreadsheet/begin-upload`,
      },
      tags: { name: '13 POST upload-and-scan', segment: 'upload' },
      timeout: '60s',
    }
  );
  assertStatus(res, 302, '13 POST upload-and-scan');

  thinkTime();
  res = http.get(
    `${frontend}/organisation/${organisationId}/spreadsheet/file-uploaded`,
    {
      tags: { name: '14 GET file-uploaded', segment: 'upload' },
      timeout: '60s',
    }
  );
  assertStatus(res, 200, '14 GET file-uploaded');
}

/**
 * Once-only create user (per VU, first UI iteration).
 * @param {{ defraStubHost: string, environment: string }} data
 * @returns {{ defraUser: string, expireHref: string }}
 */
function createUser(data) {
  const stub = `https://${data.defraStubHost}`;
  const email = `user_${timestampMs()}_${Math.floor(1000 + Math.random() * 9000)}@test.com`;
  const body = JSON.stringify({
    userId: uuidv4(),
    email,
    firstName: 'John',
    lastName: 'Doe',
    loa: '1',
    aal: '1',
    enrolmentCount: 1,
    enrolmentRequestCount: 1,
    relationships: [
      {
        organisationName: 'Some Org',
        relationshipRole: 'Employee',
        roleName: 'Some role',
        roleStatus: '1',
      },
    ],
  });

  thinkTime();
  const res = http.post(`${stub}/cdp-defra-id-stub/API/register`, body, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    tags: { name: '00 Create a User', segment: 'main_journey' },
    timeout: '60s',
  });
  assertStatus(res, 201, '00 Create a User');

  const expireMatch = String(res.body || '').match(
    /"rel"\s*:\s*"expire"\s*,\s*"href"\s*:\s*"([^"]+)"/
  );
  return {
    defraUser: email,
    expireHref: expireMatch ? expireMatch[1] : 'NOT_FOUND',
  };
}

/** Per-VU state for once-only create user. */
const vuState = {};

/**
 * One e2e iteration (direct API or UI journey).
 * @param {{
 *   environment: string,
 *   frontendHost: string,
 *   defraStubHost: string,
 *   backendHost: string,
 *   cdpApiKey: string,
 *   backendBasicAuth: string,
 * }} data
 */
export function runE2eIteration(data) {
  const threadNum = vu.idInTest - 1;
  const frontend = `https://${data.frontendHost}`;
  const stub = `https://${data.defraStubHost}`;

  // Advance shared CSV cursor every iteration (UI rows unused)
  const apiCode = nextApiCode();

  // Clear cookies at the start of each iteration
  clearCookiesForUrl(frontend);
  clearCookiesForUrl(stub);

  // Think time before traffic routing (and before each HTTP call thereafter)
  thinkTime();

  // 90% of VUs hit the direct organisation API; the remaining 10% run the UI journey
  const directApi = threadNum % 10 < 9;
  if (directApi) {
    runDirectApi(data, apiCode);
    return;
  }

  // UI main journey (10% of VUs): create a stub user once per VU, complete OIDC
  // login, then split 75% spreadsheet upload / 25% frontend API page
  const key = String(vu.idInTest);
  if (!vuState[key]) {
    vuState[key] = createUser(data);
  }
  const organisationId = runUiLogin(data, vuState[key]);

  thinkTime(); // pause before choosing upload vs API-page path
  const uiIndex = Math.floor(threadNum / 10);
  const journeyIndex = uiIndex % 4 < 3 ? 1 : 0; // 1=upload, 0=api

  if (journeyIndex === 0) {
    runFrontendApiJourney(data);
  } else {
    runUploadJourney(data, organisationId);
  }
}
