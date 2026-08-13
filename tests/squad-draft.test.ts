/**
 * The pickup point's trip out to the map and back.
 *
 * `/squads/new` hands the whole half-filled form to `/location` in a URL and
 * reads it back out when the pin is confirmed. Everything asserted here is a
 * property of that round trip: what survives it, what is refused, and what is
 * left out rather than guessed at.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { readSquadDraft, squadDraftParams, type SquadDraft } from '../lib/squad-draft.ts';
import { featurePrecision } from '../lib/place-ranking.ts';

const EMPTY: SquadDraft = {
  origin: null,
  originLabel: null,
  destination: null,
  departAt: null,
  name: null,
  purpose: null,
  capacity: null,
  visibility: null,
  meetingPoint: null,
};

/** Writes a draft to a query string and reads it straight back. */
function roundTrip(draft: SquadDraft): SquadDraft {
  return readSquadDraft(new URLSearchParams(squadDraftParams(draft).toString()));
}

// --- A. a searched place ----------------------------------------------------

test('a searched place keeps its exact coordinates and its feature type', () => {
  const back = roundTrip({
    ...EMPTY,
    meetingPoint: {
      lat: 13.006361,
      lng: 80.242541,
      label: 'IIT MADRAS MAIN GATE (IN)',
      address: 'IIT Madras In Gate Rd, Chennai',
      featureType: 'poi',
      source: 'search',
    },
  });

  assert.equal(back.meetingPoint?.lat, 13.006361);
  assert.equal(back.meetingPoint?.lng, 80.242541);
  assert.equal(back.meetingPoint?.label, 'IIT MADRAS MAIN GATE (IN)');
  assert.equal(back.meetingPoint?.address, 'IIT Madras In Gate Rd, Chennai');
  assert.equal(back.meetingPoint?.featureType, 'poi');
  assert.equal(back.meetingPoint?.source, 'search');
});

// --- G. precision is derived, never carried ---------------------------------

test('precision is derived from the feature type, not transported', () => {
  const params = squadDraftParams({
    ...EMPTY,
    meetingPoint: { lat: 13, lng: 80.2, label: 'A building', address: null, featureType: 'poi' },
  });

  // The integer is nowhere in the URL...
  assert.equal(params.get('meetingPrecision'), null);
  assert.equal(params.get('meetingFeature'), 'poi');

  // ...and is recomputed on the way back in, from the string that is.
  const back = readSquadDraft(new URLSearchParams(params.toString()));
  assert.equal(back.meetingPoint?.precision, featurePrecision('poi'));
});

test('a place with no feature type gets no precision either', () => {
  const back = roundTrip({
    ...EMPTY,
    meetingPoint: { lat: 13, lng: 80.2, label: 'A tapped pin', address: null },
  });
  assert.equal(back.meetingPoint?.featureType, undefined);
  assert.equal(back.meetingPoint?.precision, undefined, 'never defaulted to 0, which means "building"');
});

// --- B/C/D. provenance ------------------------------------------------------

test('a manually placed pin is manual, and carries no accuracy', () => {
  const back = roundTrip({
    ...EMPTY,
    meetingPoint: {
      lat: 12.9915,
      lng: 80.2183,
      label: 'Inside the mall',
      address: 'Velachery Main Rd, Chennai',
      source: 'manual',
    },
  });

  assert.equal(back.meetingPoint?.source, 'manual');
  assert.equal(back.meetingPoint?.accuracyMetres, undefined);
});

test('a device point keeps its source and its real accuracy', () => {
  const back = roundTrip({
    ...EMPTY,
    meetingPoint: {
      lat: 13,
      lng: 80.2,
      label: 'Where I am',
      address: null,
      accuracyMetres: 22,
      source: 'device',
    },
  });

  assert.equal(back.meetingPoint?.source, 'device');
  assert.equal(back.meetingPoint?.accuracyMetres, 22);
});

test('an accepted kerb suggestion travels as a suggestion, at the accepted point', () => {
  const back = roundTrip({
    ...EMPTY,
    meetingPoint: {
      lat: 12.99129,
      lng: 80.218552,
      label: 'Velachery Main Rd',
      address: 'Indira Gandhi Nagar, Chennai',
      source: 'suggestion',
      roadDistanceMetres: 0,
    },
  });

  assert.equal(back.meetingPoint?.source, 'suggestion');
  // The accepted coordinate, not the one it was suggested from.
  assert.equal(back.meetingPoint?.lat, 12.99129);
  assert.equal(back.meetingPoint?.lng, 80.218552);
});

test('a suggestion that was not accepted leaves the original point untouched', () => {
  // The pin stays where the user put it and stays `manual`; the kerb the system
  // offered leaves no trace at all, because nothing accepted it.
  const back = roundTrip({
    ...EMPTY,
    meetingPoint: {
      lat: 12.9915,
      lng: 80.2183,
      label: 'Inside the mall',
      address: 'Velachery Main Rd, Chennai',
      source: 'manual',
      roadDistanceMetres: 36,
    },
  });

  assert.equal(back.meetingPoint?.lat, 12.9915);
  assert.equal(back.meetingPoint?.lng, 80.2183);
  assert.equal(back.meetingPoint?.source, 'manual');
  // The measured distance is still recorded — it is a fact about the pin.
  assert.equal(back.meetingPoint?.roadDistanceMetres, 36);
});

// --- E/F. road confirmation -------------------------------------------------

test('a confirmed road distance survives, including zero', () => {
  const back = roundTrip({
    ...EMPTY,
    meetingPoint: { lat: 13, lng: 80.2, label: 'On the road', address: null, roadDistanceMetres: 0 },
  });
  assert.equal(back.meetingPoint?.roadDistanceMetres, 0, 'zero is a confirmation, not an absence');
});

test('no road found records nothing at all', () => {
  const params = squadDraftParams({
    ...EMPTY,
    meetingPoint: {
      lat: 12.9,
      lng: 80.6,
      label: '12.90000, 80.60000',
      address: null,
      source: 'manual',
    },
  });

  assert.equal(params.get('meetingRoadM'), null, 'no-road is never written');

  const back = readSquadDraft(new URLSearchParams(params.toString()));
  assert.equal(back.meetingPoint?.roadDistanceMetres, undefined);
  assert.equal(back.meetingPoint?.lat, 12.9, 'the pin itself is untouched');
});

// --- H. a moved pin ---------------------------------------------------------

test('a pin moved on the map carries the new coordinates, not the old ones', () => {
  const first = roundTrip({
    ...EMPTY,
    meetingPoint: {
      lat: 13.0,
      lng: 80.2,
      label: 'First',
      address: null,
      source: 'device',
      accuracyMetres: 300,
    },
  });

  // What `/location` builds when the user then taps somewhere else: a fresh
  // place, not a spread of the old one.
  const moved = roundTrip({
    ...first,
    meetingPoint: { lat: 12.98869, lng: 80.22907, label: 'Second', address: null, source: 'manual' },
  });

  assert.equal(moved.meetingPoint?.lat, 12.98869);
  assert.equal(moved.meetingPoint?.lng, 80.22907);
  assert.equal(moved.meetingPoint?.source, 'manual');
  assert.equal(
    moved.meetingPoint?.accuracyMetres,
    undefined,
    'the old fix measured a different place',
  );
});

// --- I. older drafts and hostile ones ---------------------------------------

test('a draft written before these fields existed still reads', () => {
  const back = readSquadDraft(
    new URLSearchParams('meetingLng=80.22&meetingLat=12.98&meetingPlace=Gate%201'),
  );

  assert.equal(back.meetingPoint?.lat, 12.98);
  assert.equal(back.meetingPoint?.label, 'Gate 1');
  assert.equal(back.meetingPoint?.featureType, undefined);
  assert.equal(back.meetingPoint?.source, undefined);
  assert.equal(back.meetingPoint?.roadDistanceMetres, undefined);
});

test('a hand-edited URL cannot invent provenance, accuracy or a road distance', () => {
  const back = readSquadDraft(
    new URLSearchParams(
      'meetingLng=80.2&meetingLat=13&meetingPlace=Somewhere' +
        '&meetingSource=impeccable&meetingAccuracy=-5&meetingRoadM=-9',
    ),
  );

  assert.equal(back.meetingPoint?.lat, 13);
  assert.equal(back.meetingPoint?.source, undefined, 'an unknown provenance is refused');
  assert.equal(back.meetingPoint?.accuracyMetres, undefined, 'a negative accuracy is refused');
  assert.equal(back.meetingPoint?.roadDistanceMetres, undefined, 'a negative distance is refused');
});

test('the meeting point can never be written into the destination', () => {
  // The two answer completely different questions, and the parameters that
  // carry them are disjoint by construction.
  const params = squadDraftParams({
    ...EMPTY,
    meetingPoint: { lat: 12.98, lng: 80.22, label: 'Meet here', address: null },
  });

  assert.equal(params.get('destLat'), null);
  assert.equal(params.get('destLng'), null);
  assert.equal(params.get('dest'), null);
  assert.equal(params.get('meetingLat'), '12.980000');
});

test('a draft with no meeting point produces no meeting parameters at all', () => {
  const params = squadDraftParams(EMPTY);
  for (const key of [
    'meetingLat',
    'meetingLng',
    'meetingPlace',
    'meetingSource',
    'meetingAccuracy',
    'meetingRoadM',
    'meetingFeature',
  ]) {
    assert.equal(params.get(key), null, `${key} should be absent`);
  }
});

test('the rest of the half-filled form survives alongside the pin', () => {
  // The whole reason the draft exists: leaving the form to point at a map must
  // not cost the leader everything else they had already answered.
  const back = roundTrip({
    ...EMPTY,
    destination: { lat: 13.0068, lng: 80.2399, label: 'IIT Madras', address: null },
    departAt: '2026-08-20T09:30:00.000Z',
    name: 'Morning run to campus',
    purpose: 'college',
    capacity: 4,
    visibility: 'invite',
    meetingPoint: { lat: 12.98, lng: 80.22, label: 'Gate 1', address: null },
  });

  assert.equal(back.name, 'Morning run to campus');
  assert.equal(back.purpose, 'college');
  assert.equal(back.capacity, 4);
  assert.equal(back.visibility, 'invite');
  assert.equal(back.departAt, '2026-08-20T09:30:00.000Z');
  assert.equal(back.destination?.label, 'IIT Madras');
  assert.equal(back.meetingPoint?.label, 'Gate 1');
});
