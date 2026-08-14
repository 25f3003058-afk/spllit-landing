/**
 * Live check of squad-intent extraction against the real Sarvam API.
 *
 * Deliberately a script and not a test. `npm test` proves the deterministic
 * half — the capacity ladder, the timezone arithmetic, the refusal of a
 * departure already gone — and it proves that half without a network, a key or
 * a bill. None of it says whether the model can actually read
 * "kal 9 baje Velachery se IIT Madras jaana hai", and no assertion could: the
 * answer is a judgement about output quality, it costs a metered call per case,
 * and it changes when the vendor changes their model.
 *
 * So this prints, and a person reads it. Same reasoning as
 * `testmail-verify.ts`, which exists for the same kind of question.
 *
 *   cd backend && npm run sarvam:verify
 *
 * Needs SARVAM_API_KEY (the model) and MAPBOX_SECRET_TOKEN (place resolution)
 * in backend/.env. Without the second, every place comes back unresolved and
 * the run looks like a model failure that it is not — so both are checked
 * before anything is sent.
 */

import dotenv from 'dotenv';

/**
 * Loaded before the services are imported. `sarvam.ts` and `geocode.ts` both
 * read their keys at module load, and ESM hoists static imports above
 * statements — so a static import here would evaluate them against an empty
 * environment and report "not configured" no matter what is in `.env`. The
 * wiring suite hits the same ordering problem and solves it the same way.
 */
dotenv.config();

const { extractSquadDraft } = await import('../services/squadIntent.js');
const { isSarvamConfigured } = await import('../services/sarvam.js');

/** Chennai, so places resolve the way they would for a real user here. */
const NEAR = { lat: 12.9915, lng: 80.2367 };

/** India Standard Time, in minutes to add to UTC. */
const IST = 330;

/**
 * A fixed clock, so "tomorrow" means a date that can be checked by eye rather
 * than whatever today happens to be when this is run.
 */
const NOW = new Date('2026-08-14T03:30:00.000Z'); // 2026-08-14 09:00 IST

interface Case {
  label: string;
  text: string;
  /** What a correct extraction looks like. Judged by a person, not asserted. */
  expect: string;
}

const CASES: Case[] = [
  {
    label: 'English',
    text: 'Tomorrow at 9 AM I want to go from Velachery to IIT Madras for my maths exam',
    expect: 'dest IIT Madras · origin Velachery · 15 Aug 09:00 · exam',
  },
  {
    label: 'Hindi, romanised',
    text: 'kal 9 baje Velachery se IIT Madras maths exam ke liye jaana hai',
    expect: 'same as the English case above',
  },
  {
    label: 'Code-mixed',
    text: 'IITM maths exam ke liye tomorrow morning Velachery se ride chahiye',
    expect: 'dest IITM · origin Velachery · exam · NO time — "morning" is not a clock time',
  },
  {
    label: 'Tamil',
    text: 'எனக்கு நாளைக்கு காலை 9 மணிக்கு Velachery ல இருந்து IIT Madras போகணும்',
    expect: 'dest IIT Madras · origin Velachery · 15 Aug 09:00 · purpose may be null',
  },
  {
    label: 'Incomplete',
    text: 'I need to go to IIT Madras',
    expect: 'destination only. Everything else null. Must NOT invent a departure time.',
  },
  {
    label: 'Nonsense',
    text: 'asdfghjkl',
    expect: 'understood: false. Must NOT invent a destination.',
  },
];

async function main(): Promise<void> {
  if (!isSarvamConfigured()) {
    console.error(
      'SARVAM_API_KEY is not set in backend/.env — there is nothing to verify.\n' +
        'Without it the app is still correct: /api/ai/status answers false and the\n' +
        'create form renders without the box. That path is covered by npm test.',
    );
    process.exitCode = 1;
    return;
  }

  if (!process.env.MAPBOX_SECRET_TOKEN && !process.env.MAPBOX_TOKEN) {
    console.error(
      'No Mapbox token in backend/.env. Every place would come back unresolved\n' +
        'and this run would look like a model failure that it is not. Set\n' +
        'MAPBOX_SECRET_TOKEN before reading anything into these results.',
    );
    process.exitCode = 1;
    return;
  }

  console.log(`Clock fixed at ${NOW.toISOString()} (2026-08-14 09:00 IST)`);
  console.log(`Proximity bias: Chennai (${NEAR.lat}, ${NEAR.lng})`);

  for (const testCase of CASES) {
    const startedAt = Date.now();
    const draft = await extractSquadDraft({
      text: testCase.text,
      near: NEAR,
      utcOffsetMinutes: IST,
      now: NOW,
    });
    const ms = Date.now() - startedAt;

    console.log(`\n${'─'.repeat(64)}`);
    console.log(`${testCase.label}  (${ms}ms)`);
    console.log(`  in      ${testCase.text}`);
    console.log(`  expect  ${testCase.expect}`);
    console.log(`  ${'-'.repeat(60)}`);
    console.log(`  understood   ${draft.understood}`);
    console.log(`  destination  ${place(draft.destination)}`);
    console.log(`  origin       ${place(draft.origin)}`);
    console.log(`  departAt     ${draft.departAt ?? 'null'}${asLocal(draft.departAt)}`);
    console.log(`  purpose      ${draft.purpose ?? 'null'}`);
    console.log(`  capacity     ${draft.capacity ?? 'null'}`);
    console.log(`  unresolved   ${draft.unresolved.length ? draft.unresolved.join(', ') : '—'}`);
  }

  console.log(`\n${'─'.repeat(64)}`);
  console.log(
    'Check the coordinates, not just the names: they come from Mapbox, and a\n' +
      'wrong one shows up here as a correct-looking name on the wrong point.',
  );
}

function place(value: { label: string; lat: number; lng: number } | null): string {
  if (!value) return 'null';
  return `${value.label}  (${value.lat.toFixed(4)}, ${value.lng.toFixed(4)})`;
}

/** The instant as the user would read it, since that is what the form shows. */
function asLocal(iso: string | null): string {
  if (!iso) return '';
  const shifted = new Date(new Date(iso).getTime() + IST * 60_000);
  return `   → ${shifted.toISOString().replace('T', ' ').slice(0, 16)} IST`;
}

await main();
