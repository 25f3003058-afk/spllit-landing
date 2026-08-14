/**
 * Turning what a model read out of a sentence into fields a form can hold.
 *
 * The model half cannot be asserted on — it is a third party over a network,
 * and pinning its exact output in a test would only record what it did once.
 * What *is* testable is everything this service does to that output afterwards,
 * and that is where the damage would be: a party size becoming a capacity
 * nobody can select, a clock time landing on the wrong day, a departure already
 * in the past reaching a form that will refuse it.
 *
 * Each case below is one of those, driven by a fixed clock so it means the same
 * thing tomorrow.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  toCapacity,
  toInstant,
  clampOffset,
  extractSquadDraft,
  isUnderstood,
} from '../services/squadIntent.js';
import { isSarvamConfigured } from '../services/sarvam.js';

/** India, where this runs. UTC+5:30 in minutes. */
const IST = 330;

/** 2026-08-14T09:00:00+05:30 — a Friday morning, mid-week, unremarkable. */
const NOW = new Date('2026-08-14T03:30:00.000Z');

describe('party size becomes a capacity the form offers', () => {
  it('leaves an exact rung alone', () => {
    assert.equal(toCapacity(4), 4);
  });

  it('rounds up to the next rung rather than down', () => {
    // Seven people in a squad of six leaves one behind, which is the whole
    // reason this rounds the direction it does.
    assert.equal(toCapacity(7), 8);
  });

  it('gives a solo traveller the smallest squad, not nothing', () => {
    assert.equal(toCapacity(1), 2);
  });

  it('caps an unrealistic count at the largest rung', () => {
    assert.equal(toCapacity(40), 10);
  });

  it('stays null when the sentence never said', () => {
    assert.equal(toCapacity(null), null);
  });
});

/**
 * Whether a prefilled form appears at all.
 *
 * Every case here comes from a live run. The model answers `purpose: "travel"`
 * for input that is not a trip and for input that names only a place, however
 * explicitly it is told to say "unspecified" instead — so purpose carries no
 * evidence and must not be able to open a filled-in form on its own.
 */
describe('understanding requires more than a purpose', () => {
  const nothing = {
    destination: null,
    origin: null,
    departAt: null,
    capacity: null,
    unresolved: [] as string[],
  };

  const somewhere = { lng: 80.2399, lat: 13.0068, label: 'IIT Madras', address: null, featureType: 'poi' };

  it('refuses gibberish that the model answered a purpose for', () => {
    // "asdfghjkl" came back with purpose 'travel' and nothing else.
    assert.equal(isUnderstood(nothing), false);
  });

  it('accepts a destination', () => {
    assert.equal(isUnderstood({ ...nothing, destination: somewhere }), true);
  });

  it('accepts an origin alone', () => {
    assert.equal(isUnderstood({ ...nothing, origin: somewhere }), true);
  });

  it('accepts a departure alone', () => {
    assert.equal(isUnderstood({ ...nothing, departAt: '2026-08-15T03:30:00.000Z' }), true);
  });

  it('accepts a place the map could not find', () => {
    // The sentence named somewhere. That it is unmappable is worth asking
    // about, not worth discarding the whole extraction over.
    assert.equal(isUnderstood({ ...nothing, unresolved: ['Fortune Tower'] }), true);
  });
});

describe('local date and clock time become a real instant', () => {
  it('reads a time as local, not as UTC', () => {
    // 09:00 IST is 03:30Z. Treating the clock time as UTC would put this
    // departure five and a half hours out — the single most likely way for
    // this to be wrong, and invisible on a form that prints local time.
    assert.equal(
      toInstant('2026-08-15', '09:00', IST, NOW),
      '2026-08-15T03:30:00.000Z',
    );
  });

  it('uses today when a time was given without a date', () => {
    assert.equal(
      toInstant(null, '18:00', IST, NOW),
      '2026-08-14T12:30:00.000Z',
    );
  });

  it('refuses a departure that has already gone', () => {
    // "9am" said at 9am. The form rejects a past departure, so offering one
    // produces a pre-filled draft that cannot be submitted.
    assert.equal(toInstant('2026-08-14', '08:00', IST, NOW), null);
  });

  it('refuses a date with no time rather than assuming midnight', () => {
    // A squad departing 00:00 is one nobody chose.
    assert.equal(toInstant('2026-08-16', null, IST, NOW), null);
  });

  it('refuses an impossible clock time', () => {
    assert.equal(toInstant('2026-08-15', '25:00', IST, NOW), null);
  });

  it('refuses an impossible month', () => {
    assert.equal(toInstant('2026-13-01', '09:00', IST, NOW), null);
  });

  it('crosses midnight in the right direction', () => {
    // 00:30 IST on the 16th is 19:00Z on the 15th — the previous UTC day.
    assert.equal(
      toInstant('2026-08-16', '00:30', IST, NOW),
      '2026-08-15T19:00:00.000Z',
    );
  });
});

/**
 * The unconfigured path, which is the one every deployment starts on and the
 * one a lapsed or revoked key silently returns it to.
 *
 * This suite depends on SARVAM_API_KEY being absent from the test environment,
 * which it is — `npm test` runs the service modules directly and never loads
 * `.env`. The guard below states that dependency out loud rather than letting
 * the suite quietly stop testing anything the day a key appears in the shell.
 */
describe('with no model configured', () => {
  it('reports itself unconfigured', () => {
    assert.equal(
      isSarvamConfigured(),
      false,
      'SARVAM_API_KEY is set in this shell — the cases below are not testing what they claim',
    );
  });

  it('returns an empty draft rather than throwing', async () => {
    // The create form calls this and carries on. An exception here would take
    // out the screen people use to make squads, in service of an optional
    // shortcut — the single worst way this feature could fail.
    const draft = await extractSquadDraft({
      text: 'Tomorrow at 9 AM from Velachery to IIT Madras for my maths exam',
      near: null,
      utcOffsetMinutes: IST,
    });

    assert.equal(draft.understood, false);
    assert.equal(draft.destination, null);
    assert.equal(draft.departAt, null);
    assert.deepEqual(draft.unresolved, []);
  });

  it('spends nothing on input that is too long to be a trip', async () => {
    // Rejected before the model, not by it: a caller pasting an essay should
    // not cost a metered call to find that out.
    const draft = await extractSquadDraft({
      text: 'x'.repeat(5_000),
      near: null,
      utcOffsetMinutes: IST,
    });

    assert.equal(draft.understood, false);
  });
});

describe('a client-supplied timezone offset cannot move the day', () => {
  it('keeps a real offset', () => {
    assert.equal(clampOffset(IST), 330);
  });

  it('keeps the extremes that genuinely exist', () => {
    assert.equal(clampOffset(-720), -720);
    assert.equal(clampOffset(840), 840);
  });

  it('clamps an offset no zone uses', () => {
    // Trusting this would shift every extracted departure by days.
    assert.equal(clampOffset(100_000), 840);
    assert.equal(clampOffset(-100_000), -720);
  });

  it('treats a non-number as UTC rather than NaN', () => {
    // NaN here would propagate into Date.UTC and produce an Invalid Date,
    // which stringifies to null and looks like "they didn't say a time".
    assert.equal(clampOffset(NaN), 0);
  });
});
