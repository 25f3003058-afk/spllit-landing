/**
 * When the assistant may speak first.
 *
 * Every case here is a way of being annoying. Speaking over someone who is
 * typing, speaking again after being waved away, speaking to someone who has
 * already opened it — each of those turns a helpful offer into something people
 * learn to dismiss without reading, and none of them is visible in a screenshot
 * because they are all about timing.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { pickNudge, type NudgeContext } from '../lib/ai-nudge.ts';

const SETTLED: NudgeContext = {
  secondsOnPage: 30,
  everOpened: false,
  dismissed: false,
  isOpen: false,
  hasDestination: false,
  isTyping: false,
};

test('says nothing while the visit is still young', () => {
  // Anyone who knows what they are doing has finished by now.
  assert.equal(pickNudge({ ...SETTLED, secondsOnPage: 5 }), null);
});

test('offers help once someone has clearly stalled', () => {
  const nudge = pickNudge(SETTLED);
  assert.ok(nudge, 'expected an offer after a long pause');
  assert.ok(nudge.text.length > 0);
});

test('never speaks over someone who is typing', () => {
  assert.equal(pickNudge({ ...SETTLED, isTyping: true }), null);
});

test('never speaks while it is already open', () => {
  assert.equal(pickNudge({ ...SETTLED, isOpen: true }), null);
});

test('stops for good once it has been opened', () => {
  // Opening it is an answer. Asking again afterwards is nagging.
  assert.equal(pickNudge({ ...SETTLED, everOpened: true }), null);
});

test('stops for good once it has been waved away', () => {
  assert.equal(pickNudge({ ...SETTLED, dismissed: true }), null);
});

test('the wording changes once there is a destination', () => {
  const stuck = pickNudge(SETTLED);
  const halfway = pickNudge({ ...SETTLED, hasDestination: true });

  assert.ok(stuck && halfway);
  assert.notEqual(stuck.text, halfway.text);
  // Someone who has started should not be asked where to start.
  assert.ok(!/where to start/i.test(halfway.text));
});

test('the same situation always produces the same line', () => {
  // Picking at random would reshuffle the text mid-read on every re-render.
  const first = pickNudge(SETTLED);
  const second = pickNudge(SETTLED);
  assert.deepEqual(first, second);
});

test('a longer stall eventually says something different', () => {
  const early = pickNudge({ ...SETTLED, secondsOnPage: 20 });
  const later = pickNudge({ ...SETTLED, secondsOnPage: 20 + 45 });

  assert.ok(early && later);
  assert.notEqual(early.text, later.text);
  assert.notEqual(early.id, later.id);
});

test('the offer is never a question that demands an answer', () => {
  // A bubble you have to reply to in order to dismiss is a trap.
  for (const seconds of [20, 65, 110, 155, 200]) {
    const nudge = pickNudge({ ...SETTLED, secondsOnPage: seconds });
    assert.ok(nudge);
    assert.ok(
      /\b(i|me|my)\b/i.test(nudge.text),
      `"${nudge.text}" should offer something, not interrogate`,
    );
  }
});
