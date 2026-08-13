import test from 'node:test';
import assert from 'node:assert/strict';

import {
  pickupAdvice,
  ROADSIDE_METRES,
  SUGGEST_MAX_METRES,
  type RoadSnap,
} from '../lib/pickup-advice.ts';

const road = (distanceMetres: number, roadClass = 'street'): RoadSnap => ({
  status: 'ok',
  point: [80.21855, 12.9913],
  distanceMetres,
  roadClass,
});

test('a pin already on the kerb gets no suggestion', () => {
  assert.equal(pickupAdvice(road(8, 'service')).kind, 'roadside');
  assert.equal(pickupAdvice(road(ROADSIDE_METRES)).kind, 'roadside');
});

test('just inside a campus or a mall is offered the kerb', () => {
  // Measured against the live road layer: 22 m inside IIT Madras, 36 m from
  // the centre of Phoenix Marketcity to Velachery Main Road.
  const advice = pickupAdvice(road(36));
  assert.equal(advice.kind, 'suggest');
  if (advice.kind !== 'suggest') return;
  assert.deepEqual(advice.point, [80.21855, 12.9913]);
  assert.equal(advice.distanceMetres, 36);
  assert.equal(advice.roadClass, 'street');
});

test('the offer stops before it becomes a guess', () => {
  assert.equal(pickupAdvice(road(SUGGEST_MAX_METRES)).kind, 'suggest');
  assert.equal(pickupAdvice(road(SUGGEST_MAX_METRES + 1)).kind, 'far');
});

test('a pin deep inside somewhere is reported, never moved', () => {
  const advice = pickupAdvice(road(320));
  assert.equal(advice.kind, 'far');
  // The whole point: no coordinate is handed back for the caller to adopt.
  assert.ok(!('point' in advice));
  if (advice.kind === 'far') assert.equal(advice.distanceMetres, 320);
});

test('no road nearby is a finding; an outage is not', () => {
  assert.equal(pickupAdvice({ status: 'no-road' }).kind, 'no-road');
  // 'unknown' renders nothing at all — a failed lookup must never read as a
  // fact about the place.
  assert.equal(pickupAdvice({ status: 'unavailable' }).kind, 'unknown');
});

test('the two thresholds cannot cross', () => {
  assert.ok(ROADSIDE_METRES < SUGGEST_MAX_METRES);
});
