#!/usr/bin/env node
/**
 * Deploy the Spllit API to Azure Container Apps.
 *
 *   npm run azure:deploy
 *
 * Why Azure Container Apps rather than the Cloudflare Container: `az
 * containerapp up --source .` builds the image *in Azure* (it provisions a
 * Container Registry and builds there), so no Docker daemon is needed on this
 * machine. That is the whole reason this path exists — `wrangler deploy` builds
 * locally and cannot run without Docker Desktop.
 *
 * The Dockerfile is unchanged and shared with every other host, so this is a
 * deployment target, not a fork of the backend.
 *
 * Configurable with env vars, all optional:
 *   AZ_RESOURCE_GROUP  AZ_LOCATION  AZ_ENVIRONMENT  AZ_APP_NAME
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import dotenv from 'dotenv';

const backendDir = join(dirname(fileURLToPath(import.meta.url)), '..');

const RESOURCE_GROUP = process.env.AZ_RESOURCE_GROUP ?? 'spllit';
/**
 * Central India (Pune). Every authenticated request and every Socket.IO frame
 * makes this round trip and the users are on Indian campuses, so this is
 * latency they can feel — unlike the frontend, which an edge CDN serves from
 * near them whatever region this is.
 */
const LOCATION = process.env.AZ_LOCATION ?? 'centralindia';
const ENVIRONMENT = process.env.AZ_ENVIRONMENT ?? 'spllit-env';
const APP_NAME = process.env.AZ_APP_NAME ?? 'spllit-api';

/** Secret env vars, and the Container Apps secret name each is stored under. */
const SECRETS = {
  DATABASE_URL: 'database-url',
  JWT_SECRET: 'jwt-secret',
  JWT_REFRESH_SECRET: 'jwt-refresh-secret',
  FIREBASE_PROJECT_ID: 'firebase-project-id',
  FIREBASE_CLIENT_EMAIL: 'firebase-client-email',
  FIREBASE_PRIVATE_KEY: 'firebase-private-key',
  MAPBOX_SECRET_TOKEN: 'mapbox-secret-token',
  RAZORPAY_KEY_ID: 'razorpay-key-id',
  RAZORPAY_KEY_SECRET: 'razorpay-key-secret',
  OPENAI_API_KEY: 'openai-api-key',
};
const REQUIRED = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'MAPBOX_SECRET_TOKEN',
];

/** Non-secret configuration. FRONTEND_URL drives the CORS allowlist. */
const PLAIN_ENV = {
  NODE_ENV: 'production',
  PORT: '8080',
  FRONTEND_URL: 'https://spllit.app',
  JWT_EXPIRES_IN: '1h',
  JWT_REFRESH_EXPIRES_IN: '7d',
};

function az(args, { capture = false, cwd = backendDir } = {}) {
  const result = spawnSync('az', args, {
    cwd,
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    shell: process.platform === 'win32',
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    if (capture && result.stderr) console.error(result.stderr.trim());
    return { ok: false, out: (result.stdout ?? '').trim() };
  }
  return { ok: true, out: (result.stdout ?? '').trim() };
}

// ---- preflight ------------------------------------------------------------

/**
 * "Is az installed" and "is az signed in" are checked separately because they
 * need different answers, and on Windows they are easy to conflate: with
 * shell: true a missing binary does not set `error`, it just exits non-zero
 * like any other failure. Collapsing the two told someone with no Azure CLI at
 * all to run `az login`, which cannot work.
 */
const version = spawnSync('az', ['version'], {
  stdio: 'ignore',
  shell: process.platform === 'win32',
});
if (version.error || version.status !== 0) {
  console.error('Azure CLI is not installed (or not on PATH). Install it, then re-run:');
  console.error('  winget install -e --id Microsoft.AzureCLI');
  console.error('\nOpen a new terminal afterwards so PATH is picked up.');
  process.exit(1);
}

if (!az(['account', 'show'], { capture: true }).ok) {
  console.error('Azure CLI is installed but not signed in. Run:  az login');
  process.exit(1);
}

/**
 * The containerapp extension is not in a stock CLI install and `containerapp
 * up` fails without it. Adding it is idempotent, so it is done here rather
 * than left as a documented step someone skips.
 */
console.log('▸ Ensuring the containerapp extension is present');
az(['extension', 'add', '--name', 'containerapp', '--upgrade', '--allow-preview', 'true',
    '--only-show-errors', '--output', 'none']);
az(['provider', 'register', '--namespace', 'Microsoft.App', '--output', 'none']);
az(['provider', 'register', '--namespace', 'Microsoft.OperationalInsights', '--output', 'none']);

let env;
try {
  env = dotenv.parse(readFileSync(join(backendDir, '.env'), 'utf8'));
} catch {
  console.error('Could not read backend/.env — the app cannot start without its secrets.');
  process.exit(1);
}

const missing = REQUIRED.filter((k) => !env[k]);
if (missing.length) {
  console.error('Missing (or empty) in backend/.env:\n  ' + missing.join('\n  '));
  process.exit(1);
}

// ---- 1. resource group ----------------------------------------------------

console.log(`\n▸ Resource group ${RESOURCE_GROUP} (${LOCATION})`);
az(['group', 'create', '--name', RESOURCE_GROUP, '--location', LOCATION, '--output', 'none']);

// ---- 2. build in the cloud and deploy -------------------------------------

console.log('\n▸ Building the image in Azure and deploying (first run takes several minutes)');
const up = az([
  'containerapp', 'up',
  '--name', APP_NAME,
  '--resource-group', RESOURCE_GROUP,
  '--location', LOCATION,
  '--environment', ENVIRONMENT,
  '--source', '.',
  // Also read from the Dockerfile's EXPOSE, but stated so a change there can
  // never silently point ingress at the wrong port.
  '--target-port', '8080',
  '--ingress', 'external',
]);
if (!up.ok) {
  console.error('\nDeploy failed. Full logs:  az containerapp logs show -n ' + APP_NAME + ' -g ' + RESOURCE_GROUP);
  process.exit(1);
}

// ---- 3. secrets -----------------------------------------------------------

console.log('\n▸ Secrets');
const secretArgs = [];
const envArgs = [];
for (const [key, secretName] of Object.entries(SECRETS)) {
  const value = env[key];
  if (!value) {
    console.log(`  ${key}: not set, skipping`);
    continue;
  }
  /**
   * Collapse real newlines to the literal two-character \n. firebaseAdmin.ts
   * does `.replace(/\\n/g, '\n')`, so it accepts either — but a multi-line
   * value in a command-line argument is fragile across shells, and a key that
   * arrives mangled fails as "Invalid token" on every authenticated request,
   * which looks like a login bug rather than a deploy one.
   */
  const flat = value.includes('\n') ? value.replace(/\n/g, '\\n') : value;
  secretArgs.push(`${secretName}=${flat}`);
  envArgs.push(`${key}=secretref:${secretName}`);
  console.log(`  ${key} → ${secretName}`);
}
az(['containerapp', 'secret', 'set', '--name', APP_NAME, '--resource-group', RESOURCE_GROUP,
    '--secrets', ...secretArgs, '--output', 'none']);

// ---- 4. env vars + replica pinning ----------------------------------------

for (const [k, v] of Object.entries(PLAIN_ENV)) envArgs.push(`${k}=${v}`);

console.log('\n▸ Environment and scale');
az([
  'containerapp', 'update',
  '--name', APP_NAME,
  '--resource-group', RESOURCE_GROUP,
  '--set-env-vars', ...envArgs,
  /**
   * BOTH pinned to 1, deliberately — the same constraint as max_instances: 1
   * in wrangler.jsonc. Socket.IO keeps room membership, presence and live
   * positions in process memory. Container Apps otherwise scales out to 10 on
   * load, and replicas do not share that state: two users in the same squad
   * land on different replicas and silently stop seeing each other's messages
   * and positions. It fails under exactly the traffic that causes it, which is
   * the worst way to find out. A Socket.IO Redis adapter comes first.
   *
   * min-replicas 1 also keeps the app warm. Scaling to zero is cheaper, but it
   * drops every open websocket on the way down.
   */
  '--min-replicas', '1',
  '--max-replicas', '1',
  '--output', 'none',
]);

// ---- 5. report ------------------------------------------------------------

const fqdn = az(['containerapp', 'show', '--name', APP_NAME, '--resource-group', RESOURCE_GROUP,
                 '--query', 'properties.configuration.ingress.fqdn', '--output', 'tsv'],
                { capture: true }).out;

console.log('\n─────────────────────────────────────────────');
if (fqdn) {
  console.log(`API is live at:  https://${fqdn}`);
  console.log(`Health check:    curl https://${fqdn}/health`);
  console.log('\nPoint the frontend at it (BUILD-time vars, then redeploy):');
  console.log(`  NEXT_PUBLIC_API_URL=https://${fqdn}/api`);
  console.log(`  NEXT_PUBLIC_SOCKET_URL=https://${fqdn}`);
} else {
  console.log('Deployed, but could not read the hostname. Try:');
  console.log(`  az containerapp show -n ${APP_NAME} -g ${RESOURCE_GROUP} --query properties.configuration.ingress.fqdn -o tsv`);
}
console.log('\nLogs:  az containerapp logs show -n ' + APP_NAME + ' -g ' + RESOURCE_GROUP + ' --follow');
console.log('─────────────────────────────────────────────\n');
