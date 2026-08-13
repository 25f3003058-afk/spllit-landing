/**
 * The ranking rules, over fixed candidate lists.
 *
 * Every case here is a query that was actually run against the live Search Box
 * index from Chennai, with the candidates it actually returned. The point of the
 * module being pure was always to make this possible; this is that.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  broadenQuery,
  comparePlaces,
  distanceBand,
  everyMatchIsWeak,
  featurePrecision,
  houseNumber,
  queryCoverage,
  nameStrength,
  trimTrailingArea,
  type RankablePlace,
} from '../lib/place-ranking.ts';

/** Candidate builder — only the fields the comparator reads. */
function place(
  name: string,
  precision: number,
  distanceKm: number,
  address: string | null = null,
  relevance = 0.5,
): RankablePlace {
  return { name, address, relevance, distanceKm, precision };
}

const POI = featurePrecision('poi');
const STREET = featurePrecision('street');
const LOCALITY = featurePrecision('locality');
const PLACE = featurePrecision('place');
const REGION = featurePrecision('region');

function rank(query: string, candidates: RankablePlace[]): string[] {
  return [...candidates].sort(comparePlaces(query)).map((c) => c.name);
}

test('featurePrecision: a building beats a city beats a country', () => {
  assert.ok(featurePrecision('poi') < featurePrecision('street'));
  assert.ok(featurePrecision('street') < featurePrecision('place'));
  assert.ok(featurePrecision('place') < featurePrecision('country'));
  // Unknown and absent types both land on the documented default.
  assert.equal(featurePrecision('something-new'), featurePrecision('place'));
  assert.equal(featurePrecision(undefined), featurePrecision('place'));
});

test('nameStrength: exact, prefix, all-words, partial', () => {
  assert.equal(nameStrength('fortune tower', 'Fortune Tower'), 0);
  assert.equal(nameStrength('fortune', 'Fortune Tower'), 1);
  assert.equal(nameStrength('fortune tower', 'Zudio - Fortune Tower, Sambalpur'), 2);
  assert.equal(nameStrength('fortune tower', 'Temple Tower'), 3);
  // An empty query cannot rank anything, and must not claim an exact match.
  assert.equal(nameStrength('', 'Anything'), 3);
});

test('distanceBand: trivial differences do not decide anything', () => {
  assert.equal(distanceBand(4.0), distanceBand(4.2));
  assert.ok(distanceBand(4) < distanceBand(20));
  assert.ok(distanceBand(20) < distanceBand(1175));
});

test('an administrative area never outranks a real destination, however near', () => {
  // A region centroid can easily be the closest thing returned.
  const ordered = rank('velachery', [
    place('Velachery', REGION, 0.1),
    place('Velachery', LOCALITY, 2.4, 'Chennai, Tamil Nadu'),
  ]);
  assert.deepEqual(ordered, ['Velachery', 'Velachery']);
  // Same names, so assert on identity rather than the label.
  const sorted = [
    place('Velachery', REGION, 0.1),
    place('Velachery', LOCALITY, 2.4, 'Chennai, Tamil Nadu'),
  ].sort(comparePlaces('velachery'));
  assert.equal(sorted[0]?.precision, LOCALITY);
});

test('a genuine match outranks a nearer near-miss', () => {
  // The Fortune Tower case the comparator was built around.
  assert.deepEqual(
    rank('fortune tower', [
      place('Temple Tower', POI, 1.2),
      place('P.R.P. Tower', POI, 1.4),
      place('Fortune Towers', POI, 8),
    ]),
    ['Fortune Towers', 'Temple Tower', 'P.R.P. Tower'],
  );
});

test('among genuine matches, distance decides — not exactness', () => {
  // An exact match 1,175 km away must not beat a plural 8 km away.
  assert.deepEqual(
    rank('fortune tower', [place('Fortune Tower', POI, 1175), place('Fortune Towers', POI, 8)]),
    ['Fortune Towers', 'Fortune Tower'],
  );
});

test('typing a city means the city, not a shop named after it', () => {
  // Measured: "Chennai" returns four POIs called "Chennai" nearer than the city.
  assert.equal(
    rank('Chennai', [
      place('Chennai', POI, 1.7, 'Velachery Main Rd, TN Police Housing Colony'),
      place('Chennai', POI, 2.1, 'Lattice Brg Rd, LIC Colony'),
      place('Chennai', PLACE, 6.6, 'Tamil Nadu'),
    ])[0],
    'Chennai',
  );
  const sorted = [
    place('Chennai', POI, 1.7, 'Velachery Main Rd, TN Police Housing Colony'),
    place('Chennai', PLACE, 6.6, 'Tamil Nadu'),
  ].sort(comparePlaces('Chennai'));
  assert.equal(sorted[0]?.precision, PLACE);
});

test('"T Nagar" leads with the locality, not a shop inside it', () => {
  const sorted = [
    place('T Nagar Skywalk', POI, 5.3, 'Ranganathan St, Chennai'),
    place('T nagar Market', POI, 5.1, 'Natesan St, Postal Colony, Chennai'),
    place('T Nagar', LOCALITY, 6.1, 'Chennai, Tamil Nadu'),
  ].sort(comparePlaces('T Nagar'));
  assert.equal(sorted[0]?.name, 'T Nagar');
});

test('"Chennai Central" is not read as the city', () => {
  // The trailing word is nobody's city, so nothing is trimmed and the station
  // stays ahead of an office that merely shares the word "Central".
  const sorted = [
    place('Central Excise', POI, 4, 'Chennai, Tamil Nadu'),
    place('Chennai Central', POI, 10.9, 'Kannappar Thidal, Chennai'),
  ].sort(comparePlaces('Chennai Central'));
  assert.equal(sorted[0]?.name, 'Chennai Central');
});

test('trimTrailingArea drops the city a searcher tacked on', () => {
  const road = place('Sardar Patel Road', STREET, 2, 'Anna University, Chennai, Tamil Nadu');
  assert.equal(trimTrailingArea('Sardar Patel Road Chennai', road), 'sardar patel road');
});

test('trimTrailingArea keeps a word the candidate owns, and half an area name', () => {
  // "Road" is part of the road's own name, so it survives.
  const road = place('Velachery Main Road', STREET, 1, 'Chennai, Tamil Nadu');
  assert.equal(trimTrailingArea('Velachery Main Road', road), 'Velachery Main Road');
  // "Nagar" is only half of "Anna Nagar" and is not a whole address part.
  const shop = place('Livspace', POI, 10, 'Anna Nagar, Chennai, Tamil Nadu');
  assert.equal(trimTrailingArea('Livspace Anna Nagar', shop), 'Livspace Anna Nagar');
});

test('a road with the city trimmed off leads the list', () => {
  // Measured: without the trim, an Airtel store 148 m away led this search.
  const sorted = [
    place('AIRTEL STORE - VELACHERY ROAD CHENNAI', POI, 0.148, 'Dandeeshwaram Main Rd, Chennai'),
    place('Sardar Patel Road', STREET, 2.8, 'Anna University, Chennai, Tamil Nadu'),
  ].sort(comparePlaces('Sardar Patel Road Chennai'));
  assert.equal(sorted[0]?.name, 'Sardar Patel Road');
});

test('broadenQuery asks again without the city, and only when there is one', () => {
  // Measured: "Phoenix Marketcity Chennai" returns only tenants, all of whose
  // names end in "Chennai"; the mall itself is absent until the query is asked
  // again without it.
  const tenants = [
    place('Peora - Phoenix Marketcity Chennai', POI, 2.1, 'Indira Gandhi Nagar, Chennai'),
    place('The Souled Store, Phoenix Marketcity Chennai', POI, 2.2, 'Velachery Main Rd, Chennai'),
  ];
  assert.equal(broadenQuery('Phoenix Marketcity Chennai', tenants), 'phoenix marketcity');

  // No candidate has a trailing area to remove: no second request.
  assert.equal(broadenQuery('IIT Madras', [place('IIT Madras', POI, 1.3, 'Guindy, Chennai')]), null);
  assert.equal(broadenQuery('Chennai Central', tenants), null);
});

test('the mall beats its own tenants once it is in the candidate list', () => {
  const sorted = [
    place('Peora - Phoenix Marketcity Chennai', POI, 2.1, 'Indira Gandhi Nagar, Chennai'),
    place('Mokobara Retail Store | Phoenix MarketCity Chennai', POI, 2.2, 'Velachery Main Rd, Chennai'),
    place('Phoenix Marketcity', POI, 2.2, 'Chennai, Tamil Nadu'),
  ].sort(comparePlaces('Phoenix Marketcity Chennai'));
  assert.equal(sorted[0]?.name, 'Phoenix Marketcity');
});

test('a list of near-misses is recognised as one', () => {
  // Measured: this exact query returns ten results, because "place" and "all"
  // are words. None of them is what was asked for.
  assert.equal(
    everyMatchIsWeak('zzzqqq not a real place at all', [
      place('Medugo - All your Medical Reports in One Place', POI, 6.4, 'Railway Border Rd, Chennai'),
      place('Premium 2BHK Comfort for All - Entire Place', POI, 8.8, 'Tirupathi Nagar, Chennai'),
      place('Yercaud All Property .Com', POI, 254.2, 'Near Nagalur, Yercaud'),
    ]),
    true,
  );
});

test('a list with one real answer in it is not weak', () => {
  assert.equal(
    everyMatchIsWeak('IIT Madras', [
      place('IIT Madras', POI, 1.3, 'Indian Institute Of Technology, Chennai'),
      place('Madras Cafe', POI, 2, 'Velachery, Chennai'),
    ]),
    false,
  );
  // Nothing to be unconfident about when there is nothing at all.
  assert.equal(everyMatchIsWeak('anything', []), false);
});

// --- reported from real use ------------------------------------------------

test('"IIT Madras Gate 1" is not called a non-match while showing the right answer', () => {
  // Reported from the live picker: the warning and the correct result appeared
  // together. Three query words of four are matched; the missing one is "1".
  const gate = place(
    'IIT MADRAS MAIN GATE (IN)',
    POI,
    1.8,
    'IIT Madras In Gate Rd, Indian Institute Of Technology, Chennai',
  );
  assert.ok(queryCoverage('IIT Madras Gate 1', gate.name) >= 0.6);
  assert.equal(everyMatchIsWeak('IIT Madras Gate 1', [gate]), false);
});

test('the gate still leads the campus and the shops on it', () => {
  const sorted = [
    place('SAC IIT Madras', POI, 0.3, 'Indian Institute Of Technology, Chennai'),
    place('Chai Waale - IIT Madras', POI, 0.5, 'Iit Sardar Patel Rd, Chennai'),
    place('IIT Madras Campus', POI, 1.7, 'Sardar Vallabhai, Chennai'),
    place('IIT MADRAS MAIN GATE (IN)', POI, 1.8, 'IIT Madras In Gate Rd, Chennai'),
  ].sort(comparePlaces('IIT Madras Gate 1'));
  assert.equal(sorted[0]?.name, 'IIT MADRAS MAIN GATE (IN)');
});

test('a queried venue outranks the businesses inside it', () => {
  // Reported: the mall led, and then five of its tenants filled the list. These
  // are the names the live search actually returns.
  const tenants = [
    'Mokobara Retail Store | Phoenix MarketCity Chennai',
    'The Souled Store, Phoenix Marketcity Chennai',
    'Club Sulaimani Phoenix Marketcity Chennai',
    'Peora - Phoenix Marketcity Chennai',
  ];
  const sorted = [
    ...tenants.map((name) => place(name, POI, 2.2, 'Velachery Main Rd, Indira Gandhi Nagar, Chennai')),
    // A car park is a part of the venue, not a business inside it: it leads with
    // the venue's own name, so it must not be swept down with the shops.
    place('Phoenix Marketcity Parking', POI, 2.1, 'Velachery Main Rd, Chennai'),
    place('Phoenix Marketcity', POI, 2.0, 'Velachery Main Rd, Indira Gandhi Nagar, Chennai'),
  ].sort(comparePlaces('Phoenix Marketcity Chennai'));

  assert.equal(sorted[0]?.name, 'Phoenix Marketcity');
  assert.equal(sorted[1]?.name, 'Phoenix Marketcity Parking');
  // Every tenant is below both, whatever order they end up in among themselves.
  assert.deepEqual(sorted.slice(2).map((p) => p.name).sort(), [...tenants].sort());
});

test('containment is generic, not a rule about malls', () => {
  // A campus and a building inside it.
  const campus = [
    place('SAC IIT Madras', POI, 0.3, 'Indian Institute Of Technology, Chennai'),
    place('IIT Madras', POI, 1.3, 'Indian Institute Of Technology, Chennai'),
  ].sort(comparePlaces('IIT Madras'));
  assert.equal(campus[0]?.name, 'IIT Madras');

  // A tower and a shop in it — the same shape, nothing in common with the above.
  const tower = [
    place('Zudio - Fortune Tower', POI, 2, 'Ring Road, Sambalpur'),
    place('Fortune Tower', POI, 2.1, 'Ring Road, Sambalpur'),
  ].sort(comparePlaces('Fortune Tower'));
  assert.equal(tower[0]?.name, 'Fortune Tower');
});

test('a part of a venue is not treated as a business inside it', () => {
  // "Chennai Central Suburban Terminal" leads with the venue's own name, so it
  // is a part of the station rather than a shop in it, and keeps its place.
  const sorted = [
    place('Chennai Central Suburban Terminal', POI, 11.1, 'Kannappar Thidal, Chennai'),
    place('Starbucks Chennai Central', POI, 11.0, 'Kannappar Thidal, Chennai'),
  ].sort(comparePlaces('Chennai Central'));
  assert.equal(sorted[0]?.name, 'Chennai Central Suburban Terminal');
});

test('an exact house number beats a different number on the same street', () => {
  // Reported: "1 Bazullah Road T Nagar" led with number 14. Mapbox formats the
  // real one number-last, which is why it is written that way here.
  const sorted = [
    place('14 Bazullah Road, T Nagar', POI, 6.2, 'Bazullah Rd, Parthasarathy Puram, Chennai'),
    place('Fruit Shop on Greams Road, T. Nagar', POI, 6.2, 'Rajan St, Chennai'),
    place('Bazullah Road 1', 1, 6.2, 'Chennai'),
  ].sort(comparePlaces('1 Bazullah Road T Nagar'));

  assert.equal(sorted[0]?.name, 'Bazullah Road 1');
  // The wrong number is demoted below the right one but not below everything:
  // number 14 on the right road still beats a fruit shop on another one.
  assert.equal(sorted[1]?.name, '14 Bazullah Road, T Nagar');
});

test('a house number is read only where one is actually written', () => {
  assert.equal(houseNumber('1 Bazullah Road T Nagar'), '1');
  assert.equal(houseNumber('12a Second Street'), '12a');
  // Trailing numbers name gates, terminals and phases — not houses.
  assert.equal(houseNumber('IIT Madras Gate 1'), null);
  assert.equal(houseNumber('Terminal 2'), null);
  // Ordinals and flat sizes are not house numbers either.
  assert.equal(houseNumber('1st Main Road'), null);
  assert.equal(houseNumber('2bhk apartment'), null);
});

test('an address whose number is nowhere in the results says so', () => {
  // The street is right and the number is missing: for a car being sent
  // somewhere, that is exactly when a confident list is dangerous.
  assert.equal(
    everyMatchIsWeak('1 Bazullah Road T Nagar', [
      place('14 Bazullah Road, T Nagar', POI, 6.2, 'Bazullah Rd, Chennai'),
      place('Bazullah Rd', STREET, 6.2, 'Chennai, Tamil Nadu'),
    ]),
    true,
  );
  // ...and stays quiet once the number itself is on the list.
  assert.equal(
    everyMatchIsWeak('1 Bazullah Road T Nagar', [
      place('14 Bazullah Road, T Nagar', POI, 6.2, 'Bazullah Rd, Chennai'),
      place('Bazullah Road 1', 1, 6.2, 'Chennai'),
    ]),
    false,
  );
});

// --- spacing variants -------------------------------------------------------

test('a name written "Market City" answers a query typed "Marketcity"', () => {
  assert.equal(queryCoverage('Phoenix Marketcity', 'Phoenix Market City Mall'), 1);
  // ...and the other way round, which is how people actually type it.
  assert.equal(queryCoverage('Phoenix Market City', 'Phoenix Marketcity'), 1);
  // Fully concatenated, too.
  assert.equal(queryCoverage('phoenixmarketcity', 'Phoenix Market City'), 1);
});

test('"Phoenix Marketcity Mall" and "Phoenix Marketcity" reach each other', () => {
  assert.equal(queryCoverage('Phoenix Marketcity Mall', 'Phoenix Market City Mall'), 1);
  // The extra word is the candidate's, not the query's, so coverage is full.
  assert.equal(queryCoverage('Phoenix Marketcity', 'Phoenix Marketcity Mall'), 1);
});

test('the spacing variant is no longer sorted below the tenants', () => {
  const sorted = [
    place('Club Sulaimani Phoenix Marketcity Chennai', POI, 2.1, 'Indira Gandhi Nagar, Chennai'),
    place('Peora - Phoenix Marketcity Chennai', POI, 2.1, 'Indira Gandhi Nagar, Chennai'),
    place('Phoenix Market City Mall', POI, 2.1, 'Velachery Main Rd, Chennai'),
  ].sort(comparePlaces('Phoenix Marketcity Chennai'));
  assert.equal(sorted[0]?.name, 'Phoenix Market City Mall');
});

test('a shop inside the venue is still a shop when the spelling differs', () => {
  // The containment rule has to see through the spacing too, or a tenant of
  // "Market City" escapes it while a tenant of "Marketcity" does not.
  const sorted = [
    place('Crossword, Phoenix Market City Mall', POI, 2.2, 'Velachery Main Rd, Chennai'),
    place('Phoenix Market City', POI, 2.2, 'Velachery Main Rd, Chennai'),
  ].sort(comparePlaces('Phoenix Marketcity'));
  assert.equal(sorted[0]?.name, 'Phoenix Market City');
});

test('ordinary words do not concatenate into accidental matches', () => {
  // Joining is consecutive and in order, so a name cannot be welded together to
  // answer a word it does not contain.
  assert.equal(queryCoverage('citymarket', 'Market City'), 0);
  assert.equal(queryCoverage('parkland', 'Land Park'), 0);
  // A short word must not be satisfied by welding a whole name together: the run
  // stops as soon as it is long enough for the word being looked for.
  assert.equal(queryCoverage('an', 'Alpha November'), 0);
  assert.equal(queryCoverage('zz', 'Zebra Zulu'), 0);
  // Unrelated names stay unrelated.
  assert.equal(queryCoverage('Velachery', 'Anna Nagar'), 0);
});

test('spacing tolerance does not weaken the house number', () => {
  // The number is still matched as a whole token and nothing else.
  const sorted = [
    place('14 Bazullah Road, T Nagar', POI, 6.2, 'Bazullah Rd, Parthasarathy Puram, Chennai'),
    place('Bazullah Road 1', 1, 6.1, 'Chennai'),
  ].sort(comparePlaces('1 Bazullah Road T Nagar'));
  assert.equal(sorted[0]?.name, 'Bazullah Road 1');

  // A number must never be reached by joining words together — "1" cannot be
  // answered by a name simply because some run of it starts with a digit.
  assert.equal(houseNumber('1 Bazullah Road T Nagar'), '1');
  assert.equal(houseNumber('IIT Madras Gate 1'), null);
  assert.equal(houseNumber('Terminal 2'), null);
  assert.equal(houseNumber('Phase 3'), null);
});

test('spacing tolerance leaves Gate 1 and the nonsense query alone', () => {
  const gate = place('IIT MADRAS MAIN GATE (IN)', POI, 1.8, 'IIT Madras In Gate Rd, Chennai');
  assert.equal(everyMatchIsWeak('IIT Madras Gate 1', [gate]), false);

  const sorted = [
    place('SAC IIT Madras', POI, 0.3, 'Indian Institute Of Technology, Chennai'),
    gate,
  ].sort(comparePlaces('IIT Madras Gate 1'));
  assert.equal(sorted[0]?.name, 'IIT MADRAS MAIN GATE (IN)');

  assert.equal(
    everyMatchIsWeak('zzzqqq not a real place at all', [
      place('Medugo - All your Medical Reports in One Place', POI, 6.4, 'Railway Border Rd, Chennai'),
      place('Premium 2BHK Comfort for All - Entire Place', POI, 8.8, 'Tirupathi Nagar, Chennai'),
      place('Yercaud All Property .Com (Real Estate Services)', POI, 254.2, 'Near Nagalur, Yercaud'),
    ]),
    true,
  );
});

// --- locality vs containment ------------------------------------------------

test('the real venue beats a business inside it across a distance-band edge', () => {
  // Reported from the live app. The two straddle the 5 km band edge, so the
  // band key decided before containment was ever consulted and the tenant led.
  const sorted = [
    place('CeeDeeYes Fortune Towers', POI, 4.5, 'Old Mahabalipuram Rd, Chennai'),
    place('Fortune Towers', POI, 5.5, 'Chennai, Tamil Nadu'),
  ].sort(comparePlaces('FORTUNE TOWER'));

  assert.equal(sorted[0]?.name, 'Fortune Towers');
});

test('two hundred metres either side of the band edge does not change the answer', () => {
  // The artefact was a cliff, not a gradient: 4.9 vs 5.1 flipped it too.
  for (const [tenantKm, venueKm] of [
    [4.9, 5.1],
    [4.5, 5.5],
    [4.5, 4.9],
    [5.7, 7.1],
  ] as const) {
    const sorted = [
      place('CeeDeeYes Fortune Towers', POI, tenantKm, 'Chennai, Tamil Nadu'),
      place('Fortune Towers', POI, venueKm, 'Chennai, Tamil Nadu'),
    ].sort(comparePlaces('FORTUNE TOWER'));
    assert.equal(sorted[0]?.name, 'Fortune Towers', `${tenantKm}km vs ${venueKm}km`);
  }
});

test('a local business still beats the same venue a thousand kilometres away', () => {
  // The other half of the rule, and the one the comparator was built around:
  // among things that genuinely match, the near one wins. A tenant two
  // kilometres away is a better answer than the venue itself in another state.
  const sorted = [
    place('Fortune Tower', POI, 1009, 'Bhubaneswar, Odisha'),
    place('CeeDeeYes Fortune Towers', POI, 2, 'Old Mahabalipuram Rd, Chennai'),
  ].sort(comparePlaces('FORTUNE TOWER'));

  assert.equal(sorted[0]?.name, 'CeeDeeYes Fortune Towers');
});

test('a regional result beats a distant one, and both lose to a local one', () => {
  const sorted = [
    place('Fortune Tower', POI, 1009, 'Bhubaneswar, Odisha'),
    place('Fortune Tower', POI, 120, 'Vellore, Tamil Nadu'),
    place('Fortune Towers', POI, 5.5, 'Chennai, Tamil Nadu'),
  ].sort(comparePlaces('FORTUNE TOWER'));

  assert.deepEqual(
    sorted.map((p) => Math.round(p.distanceKm)),
    [6, 120, 1009],
  );
});

test('distance still decides when containment cannot separate two candidates', () => {
  // Neither is inside the other, so the band is still the key that matters and
  // the nearer one still wins — including across the 5 km edge.
  const sorted = [
    place('Fortune Towers', POI, 5.5, 'Chennai, Tamil Nadu'),
    place('Fortune Towers Annexe', POI, 4.5, 'Chennai, Tamil Nadu'),
  ].sort(comparePlaces('FORTUNE TOWER'));

  assert.equal(sorted[0]?.distanceKm, 4.5);
});

test('the comparator is a total order — no pair disagrees with itself', () => {
  const candidates = [
    place('IIT Madras', POI, 1.3, 'Indian Institute Of Technology, Chennai'),
    place('IIT Madras Campus', POI, 1.7, 'Sardar Vallabhai, Chennai'),
    place('Chennai', PLACE, 6.6, 'Tamil Nadu'),
    place('T Nagar', LOCALITY, 6.1, 'Chennai, Tamil Nadu'),
    place('Building', STREET, 3.7, 'Alandur, Chennai, Tamil Nadu'),
    place('Tamil Nadu', REGION, 0.4, null),
  ];
  const compare = comparePlaces('IIT Madras');
  for (const a of candidates) {
    for (const b of candidates) {
      assert.equal(
        Math.sign(compare(a, b)) + Math.sign(compare(b, a)),
        0,
        `asymmetry between "${a.name}" and "${b.name}"`,
      );
    }
  }
});
