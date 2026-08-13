import test from 'node:test';
import assert from 'node:assert/strict';

import { dedupePlaces } from '../lib/place-dedupe.ts';

test('collapses the same name at the same coordinates', () => {
  // Measured: "Velachery" comes back twice at 80.21935,12.96733.
  const kept = dedupePlaces([
    { name: 'Velachery', center: [80.21934, 12.96734] },
    { name: 'Velachery', center: [80.21935, 12.96733] },
  ]);
  assert.equal(kept.length, 1);
});

test('collapses a name repeated a few metres away', () => {
  // Measured: "IIT Madras Campus" at 80.24191 and 80.24190 — about a metre.
  const kept = dedupePlaces([
    { name: 'IIT Madras Campus', center: [80.24191, 13.00612] },
    { name: 'IIT Madras Campus', center: [80.2419, 13.00612] },
  ]);
  assert.equal(kept.length, 1);
});

test('collapses across punctuation and case', () => {
  const kept = dedupePlaces([
    { name: 'Phoenix Market City Mall', center: [80.21683, 12.99184] },
    { name: 'phoenix  market-city mall', center: [80.21684, 12.99185] },
  ]);
  assert.equal(kept.length, 1);
});

test('keeps the higher-ranked copy — the first one given', () => {
  const kept = dedupePlaces([
    { name: 'Chennai Central', center: [80.27553, 13.08236] },
    { name: 'Chennai Central', center: [80.27559, 13.08261] },
  ]);
  assert.deepEqual(kept[0]?.center, [80.27553, 13.08236]);
});

test('keeps two entrances that are genuinely different places', () => {
  // Measured: "Chennai Central" also returns a Station Road entry ~500 m off.
  // Two different places to stand and wait, so both must survive.
  const kept = dedupePlaces([
    { name: 'Chennai Central', center: [80.27553, 13.08236] },
    { name: 'Chennai Central', center: [80.27109, 13.08032] },
  ]);
  assert.equal(kept.length, 2);
});

test('keeps different places at the same address', () => {
  // A shop and the corner outside it are metres apart and are not the same
  // answer to "where shall we meet".
  const kept = dedupePlaces([
    { name: 'The Souled Store', center: [80.21644, 12.99104] },
    { name: 'Club Sulaimani', center: [80.21646, 12.99105] },
  ]);
  assert.equal(kept.length, 2);
});

test('one venue described two ways is shown once', () => {
  // Reported: "Chennai Central" filled the list with six versions of itself.
  // The station and its full name are 136 m apart and are one destination.
  const kept = dedupePlaces([
    { name: 'Chennai Central', center: [80.27553, 13.08236] },
    { name: 'Chennai Central Railway Station', center: [80.27618, 13.08341] },
  ]);
  assert.equal(kept.length, 1);
  assert.equal(kept[0]?.name, 'Chennai Central');
});

test('grouping keeps whichever the comparator ranked higher', () => {
  const kept = dedupePlaces([
    { name: 'Chennai Central Railway Station', center: [80.27618, 13.08341] },
    { name: 'Chennai Central', center: [80.27553, 13.08236] },
  ]);
  assert.deepEqual(
    kept.map((p) => p.name),
    ['Chennai Central Railway Station'],
  );
});

test('a genuinely different part of the same station survives', () => {
  // 315 m from the main entrance: a different platform to be told to meet at.
  const kept = dedupePlaces([
    { name: 'Chennai Central', center: [80.27553, 13.08236] },
    { name: 'Chennai Central Suburban Terminal', center: [80.27393, 13.08473] },
  ]);
  assert.equal(kept.length, 2);
});

test('grouping needs proximity as well as the name', () => {
  // Same words, opposite ends of a city: two different places entirely.
  const kept = dedupePlaces([
    { name: 'Anna Nagar', center: [80.21613, 13.08611] },
    { name: 'Anna Nagar West Depot', center: [80.19, 13.09] },
  ]);
  assert.equal(kept.length, 2);
});

test('two unrelated names at the same spot both survive', () => {
  // Neither name contains the other, so proximity alone must not merge them.
  const kept = dedupePlaces([
    { name: 'Chennai Central', center: [80.27553, 13.08236] },
    { name: 'Ripon Building', center: [80.27556, 13.08239] },
  ]);
  assert.equal(kept.length, 2);
});

test('leaves an empty or single list alone', () => {
  assert.deepEqual(dedupePlaces([]), []);
  assert.equal(dedupePlaces([{ name: 'Solo', center: [80, 13] }]).length, 1);
});
