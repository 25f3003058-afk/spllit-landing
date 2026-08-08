#!/usr/bin/env node
/**
 * Upload the container's secrets to the spllit-api Worker from backend/.env.
 *
 *   npm run cf:secrets:push
 *
 * `wrangler secret put` prompts once per secret, which is eleven prompts and a
 * good chance of pasting the wrong thing into the wrong one. `secret bulk`
 * takes them all at once, and it reads JSON from stdin — so the values are
 * piped straight into the child process and never written to a temp file that
 * could be left behind or picked up by a backup.
 *
 * Only the names the container actually reads are sent. Anything else in .env
 * (test-mail credentials, PORT) stays local: a secret that reaches production
 * without being needed there is just extra blast radius.
 */
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import dotenv from 'dotenv';

const backendDir = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Must stay in step with `envVars` on SpllitBackend in edge/worker.ts. */
const REQUIRED = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'MAPBOX_SECRET_TOKEN',
];
const OPTIONAL = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'OPENAI_API_KEY'];

/**
 * Parsed with dotenv rather than a regex here, and not by accident: .env holds
 * a multi-line quoted PEM (FIREBASE_PRIVATE_KEY), which hand-rolled parsers get
 * wrong in ways that are silent and dangerous. The version this replaced let
 * `=\s*` eat the newline after an empty value and swallow the following line,
 * so RAZORPAY_KEY_SECRET= (empty) came back holding the literal text
 * "RAZORPAY_WEBHOOK_SECRET=" — a wrong value uploaded as a real secret, which
 * is worse than no value at all. dotenv is what the server itself reads, so
 * using it means this script cannot disagree with production about what a
 * variable contains.
 */
let env;
try {
  env = dotenv.parse(readFileSync(join(backendDir, '.env'), 'utf8'));
} catch {
  console.error('Could not read backend/.env — nothing to upload.');
  process.exit(1);
}

const payload = {};
const missing = [];
const skipped = [];

for (const key of REQUIRED) {
  const v = env[key];
  if (v) payload[key] = v;
  else missing.push(key);
}
for (const key of OPTIONAL) {
  const v = env[key];
  if (v) payload[key] = v;
  else skipped.push(key);
}

if (missing.length) {
  console.error('Missing (or empty) in backend/.env:\n  ' + missing.join('\n  '));
  console.error('\nThe container will not start without these. Fill them in and re-run.');
  process.exit(1);
}
if (skipped.length) {
  console.warn('Not set, skipping (features degrade, deploy still works):');
  for (const k of skipped) console.warn('  ' + k);
  console.warn('');
}

console.log('Uploading to the spllit-api Worker:');
for (const k of Object.keys(payload)) console.log(`  ${k}  (${payload[k].length} chars)`);
console.log('');

const child = spawn('npx', ['wrangler', 'secret', 'bulk'], {
  cwd: backendDir,
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: process.platform === 'win32',
});
child.stdin.end(JSON.stringify(payload));
child.on('exit', (code) => process.exit(code ?? 1));
