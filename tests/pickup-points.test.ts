/**
 * The verified-pickup-point seam.
 *
 * The shipped table is empty on purpose, so these run over fixtures. The point
 * is that the day someone adds a real gate, the matching it goes through has
 * already been decided and checked.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  matchPickupPoints,
  PICKUP_POINTS,
  type VerifiedPickupPoint,
} from '../content/pickup-points.ts';

const FIXTURES: VerifiedPickupPoint[] = [
  {
    id: 'spllit:iitm-gate-1',
    name: 'IIT Madras Gate 1',
    address: 'IIT Madras, Sardar Patel Road',
    center: [80.24254, 13.00636],
    aliases: ['main gate'],
  },
  {
    id: 'spllit:iitm-gate-2',
    name: 'IIT Madras Velachery Gate',
    address: 'IIT Madras',
    center: [80.2296, 12.98835],
    aliases: ['back gate'],
  },
];

test('ships empty, and an empty table matches nothing', () => {
  assert.deepEqual(PICKUP_POINTS, []);
  assert.deepEqual(matchPickupPoints('IIT Madras Gate 1'), []);
});

test('every word has to be present somewhere', () => {
  assert.deepEqual(
    matchPickupPoints('iit madras gate 1', FIXTURES).map((p) => p.id),
    ['spllit:iitm-gate-1'],
  );
  // Both gates belong to the same campus, so both answer the campus.
  assert.equal(matchPickupPoints('iit madras', FIXTURES).length, 2);
  assert.deepEqual(matchPickupPoints('iit bombay gate', FIXTURES), []);
});

test('an alias is matched as readily as the name', () => {
  assert.deepEqual(
    matchPickupPoints('back gate', FIXTURES).map((p) => p.id),
    ['spllit:iitm-gate-2'],
  );
});

test('the address counts, so a campus name finds its own gates', () => {
  assert.equal(matchPickupPoints('sardar patel road', FIXTURES).length, 1);
});

test('an empty query matches nothing rather than everything', () => {
  assert.deepEqual(matchPickupPoints('   ', FIXTURES), []);
});

test('ids are namespaced so they cannot collide with a mapbox_id', () => {
  for (const point of [...PICKUP_POINTS, ...FIXTURES]) {
    assert.ok(point.id.startsWith('spllit:'), `${point.id} is not namespaced`);
  }
});
