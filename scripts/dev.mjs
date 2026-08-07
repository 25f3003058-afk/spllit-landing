#!/usr/bin/env node
/**
 * Starts the web app and the API together.
 *
 * Spllit needs two processes: Next on :3000 and the Express/Socket.IO API on
 * :3001. `npm run dev` used to start only the first, so the app loaded, Google
 * sign-in succeeded against Firebase, and then the very next call — the one
 * that creates the local profile — hit nothing. The symptom was an
 * unexplained sign-in failure, and the cause was a second terminal nobody
 * mentioned.
 *
 * Written with child_process rather than adding `concurrently`: this is a
 * dozen lines, and a dev-only convenience is a poor reason to add a dependency
 * to a project that ships.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const backend = join(root, 'backend');

if (!existsSync(join(backend, 'node_modules'))) {
  console.error(
    '\n  The API has no node_modules. Run:\n\n    cd backend && npm install\n',
  );
  process.exit(1);
}

/** ANSI colours so two interleaved logs stay readable. */
const tag = (name, colour) => `\x1b[${colour}m[${name}]\x1b[0m`;

const children = [];

function start(name, colour, command, args, cwd) {
  // shell:true — npm and npx are .cmd shims on Windows and are not directly
  // executable otherwise.
  const child = spawn(command, args, { cwd, shell: true, stdio: ['ignore', 'pipe', 'pipe'] });

  const relay = (stream, isError) => {
    stream.setEncoding('utf8');
    stream.on('data', (chunk) => {
      for (const line of chunk.split('\n')) {
        if (!line.trim()) continue;
        (isError ? process.stderr : process.stdout).write(`${tag(name, colour)} ${line}\n`);
      }
    });
  };

  relay(child.stdout, false);
  relay(child.stderr, true);

  child.on('exit', (code) => {
    // One half of the app dying leaves the other in a state that looks broken
    // in a confusing way, so both go down together.
    if (code !== 0 && code !== null) {
      console.error(`\n${tag(name, colour)} exited with code ${code}. Stopping.\n`);
      shutdown(code);
    }
  });

  children.push(child);
  return child;
}

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

console.log('\n  Starting Spllit — web on :3000, API on :3001\n');

start('api', '36', 'npm', ['run', 'dev'], backend); // cyan
start('web', '32', 'npx', ['next', 'dev'], root); // green
