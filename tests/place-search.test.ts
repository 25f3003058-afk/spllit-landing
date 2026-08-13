/**
 * How many times the provider is asked, and what is done with the answers.
 *
 * The provider is a fake that records every query it is handed, so the things
 * worth asserting here are the ones a live search cannot demonstrate: that a
 * normal search costs exactly two requests, that recovery costs exactly one more
 * and only on evidence, and that an abort mid-flight is not swallowed.
 *
 * The fixtures are the names Mapbox actually returns. "Phoenix Market City"
 * really does answer with ten tenants and no mall; "Phoenix Marketcity" really
 * does answer with the mall.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { followUpQuery, searchPlaces, SearchFailed, type SearchCandidate } from '../lib/place-search.ts';

function candidate(
  name: string,
  options: { address?: string | null; km?: number; precision?: number; center?: [number, number] } = {},
): SearchCandidate {
  return {
    id: `id:${name}`,
    name,
    address: options.address ?? 'Velachery Main Rd, Indira Gandhi Nagar, Chennai',
    center: options.center ?? [80.2168, 12.9918],
    relevance: 0.5,
    distanceKm: options.km ?? 2.2,
    precision: options.precision ?? 0,
  };
}

/** The mall's tenants, exactly as the live index returns them. */
const TENANTS = [
  'Punjab Grill Phoenix Market City',
  'Pizza Hut | Phoenix Market City, Chennai',
  'Toscano Phoenix Market City',
  'Tovo Phoenix Market City',
  'Soch at Phoenix Market City, Chennai',
].map((name) => candidate(name));

const MALL = candidate('Phoenix Marketcity', { km: 2.0, center: [80.21683, 12.99184] });

/** Records what it was asked, and answers from a table. */
function fakeProvider(answers: Record<string, SearchCandidate[]>) {
  const asked: string[] = [];
  const fetchPlaces = async (query: string) => {
    asked.push(query);
    return answers[query] ?? [];
  };
  return { asked, fetchPlaces };
}

test('a normal search costs exactly two requests', () => {
  // A genuine venue is already in the first answers, so there is nothing to
  // recover and nothing to broaden.
  const { asked, fetchPlaces } = fakeProvider({ 'Phoenix Marketcity': [MALL, ...TENANTS] });
  return searchPlaces('Phoenix Marketcity', fetchPlaces).then(() => {
    assert.deepEqual(asked, ['Phoenix Marketcity', 'Phoenix Marketcity']);
  });
});

test('a tenant-only answer triggers exactly one recovery request', async () => {
  const { asked, fetchPlaces } = fakeProvider({
    'Phoenix Market City': TENANTS,
    'phoenix marketcity': [MALL],
  });

  await searchPlaces('Phoenix Market City', fetchPlaces);

  assert.equal(asked.length, 3, 'two base passes and one recovery');
  assert.deepEqual(asked.slice(0, 2), ['Phoenix Market City', 'Phoenix Market City']);
  assert.equal(asked[2], 'phoenix marketcity');
});

test('"Phoenix Market City" recovers the venue and ranks it first', async () => {
  const { fetchPlaces } = fakeProvider({
    'Phoenix Market City': TENANTS,
    'phoenix marketcity': [MALL],
  });

  const results = await searchPlaces('Phoenix Market City', fetchPlaces);

  assert.equal(results[0]?.name, 'Phoenix Marketcity');
  // Merged, not replaced: the tenants are still there, below the venue.
  assert.equal(results.length, TENANTS.length + 1);
});

test('a recovered duplicate of something already found is deduplicated', async () => {
  // The recovery returns the mall under a second id at the same spot.
  const alias = { ...MALL, id: 'id:duplicate' };
  const { fetchPlaces } = fakeProvider({
    'Phoenix Market City': TENANTS,
    'phoenix marketcity': [MALL, alias],
  });

  const results = await searchPlaces('Phoenix Market City', fetchPlaces);
  assert.equal(results.filter((r) => r.name === 'Phoenix Marketcity').length, 1);
});

test('recovery may only contribute the venue it went looking for', async () => {
  // A guessed spelling that misses must not pour unrelated places into a list
  // that was merely incomplete.
  const { fetchPlaces } = fakeProvider({
    'Phoenix Market City': TENANTS,
    'phoenix marketcity': [
      candidate('Marina Beach', { km: 9 }),
      candidate('Some Other Mall', { km: 4 }),
    ],
  });

  const results = await searchPlaces('Phoenix Market City', fetchPlaces);
  assert.deepEqual(
    results.map((r) => r.name).sort(),
    TENANTS.map((t) => t.name).sort(),
    'nothing useful came back, so the original results stand unchanged',
  );
});

test('a house-number query never triggers venue recovery', async () => {
  // Every answer here is "contained" by the containment rule, so the only thing
  // holding recovery back is that a house number must never be welded to a
  // street name.
  const { asked, fetchPlaces } = fakeProvider({
    '1 Bazullah Road T Nagar': [
      candidate('Shop at 1 Bazullah Road T Nagar', { km: 6.2 }),
      candidate('Cafe 1 Bazullah Road T Nagar', { km: 6.2 }),
    ],
  });

  await searchPlaces('1 Bazullah Road T Nagar', fetchPlaces);
  assert.equal(asked.length, 2, 'no third request for an address');
});

test('broadening keeps the follow-up slot when both moves apply', () => {
  // Measured: "Phoenix Marketcity Chennai" returns tenants only, so both
  // triggers fire. Broadening asks "phoenix marketcity" and finds the mall,
  // where concatenating would ask "phoenix marketcitychennai" and find nothing.
  const tenants = [
    candidate('Peora - Phoenix Marketcity Chennai'),
    candidate('The Souled Store, Phoenix Marketcity Chennai'),
  ];
  const followUp = followUpQuery('Phoenix Marketcity Chennai', tenants);
  assert.equal(followUp?.kind, 'broadened');
  assert.equal(followUp?.query, 'phoenix marketcity');
});

test('no follow-up when a real venue is already among the results', () => {
  assert.equal(followUpQuery('Phoenix Marketcity', [MALL, ...TENANTS]), null);
  // Nor for a query nothing fully matched — "IIT Madras Gate 1" has no "1" in
  // any result, so nothing is "contained" and there is nothing to recover.
  assert.equal(
    followUpQuery('IIT Madras Gate 1', [
      candidate('IIT MADRAS MAIN GATE (IN)', { km: 1.8, address: 'IIT Madras In Gate Rd, Chennai' }),
      candidate('SAC IIT Madras', { km: 0.3, address: 'Indian Institute Of Technology, Chennai' }),
    ]),
    null,
  );
  // Nor for a nonsense query, whose results match nothing at all.
  assert.equal(
    followUpQuery('zzzqqq not a real place at all', [
      candidate('Medugo - All your Medical Reports in One Place', { km: 6.4 }),
    ]),
    null,
  );
  // Nor when there were no results to draw evidence from.
  assert.equal(followUpQuery('anything', []), null);
});

test('an abort is never swallowed, in either pass', async () => {
  const abort = new DOMException('The operation was aborted.', 'AbortError');

  await assert.rejects(
    searchPlaces('Phoenix Market City', async () => {
      throw abort;
    }),
    (error: unknown) => error === abort,
    'an abort during the base passes propagates as itself',
  );

  // ...and during the follow-up, where a plain failure would be swallowed.
  let call = 0;
  await assert.rejects(
    searchPlaces('Phoenix Market City', async () => {
      call += 1;
      if (call <= 2) return TENANTS;
      throw abort;
    }),
    (error: unknown) => error === abort,
  );
});

test('a failed follow-up leaves the original results standing', async () => {
  let call = 0;
  const results = await searchPlaces('Phoenix Market City', async () => {
    call += 1;
    if (call <= 2) return TENANTS;
    throw new Error('gateway timeout');
  });

  assert.equal(results.length, TENANTS.length);
});

test('every request failing is an error, not an empty list', async () => {
  await assert.rejects(
    searchPlaces('Phoenix Market City', async () => {
      throw new Error('401');
    }),
    SearchFailed,
  );
});

test('a verified pickup point survives a total provider outage', async () => {
  const verified = candidate('IIT Madras Gate 1', { km: 1.8, precision: -1 });
  const results = await searchPlaces(
    'IIT Madras Gate 1',
    async () => {
      throw new Error('503');
    },
    { verified: [verified] },
  );
  assert.deepEqual(
    results.map((r) => r.name),
    ['IIT Madras Gate 1'],
  );
});

test('recovery is generic — it is not a rule about one mall', async () => {
  // Same shape, different venue, different words: a hotel the provider indexes
  // as "Greenpark", asked for as "Green Park". Nothing in the pipeline mentions
  // either name, and the live index really does behave this way — "greenpark
  // chennai" returns Hotel Greenpark and "Green Park Chennai" does not.
  const tenants = [
    candidate('Spa at Green Park', { address: 'Vadapalani, Chennai' }),
    candidate('Banquet Hall Green Park', { address: 'Vadapalani, Chennai' }),
  ];
  const hotel = candidate('Greenpark Chennai', { address: 'Vadapalani, Chennai', km: 3 });

  const { asked, fetchPlaces } = fakeProvider({
    'Green Park': tenants,
    greenpark: [hotel],
  });

  const results = await searchPlaces('Green Park', fetchPlaces);

  assert.equal(asked.length, 3, 'two base passes and one recovery');
  assert.equal(asked[2], 'greenpark');
  assert.equal(results[0]?.name, 'Greenpark Chennai', 'the venue leads its own tenants');
});
