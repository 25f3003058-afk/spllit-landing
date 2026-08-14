import { z } from 'zod';

import { chatJson, isSarvamConfigured } from './sarvam.js';
import { resolvePlace, type ResolvedPlace } from './geocode.js';

/**
 * "Tomorrow 9am I need to go from Velachery to IIT Madras for my Maths exam"
 * → the fields the create form would otherwise ask for one at a time.
 *
 * The form is seven questions deep — purpose, destination, origin, date, time,
 * capacity, visibility — and most people arrive already knowing all seven and
 * having just said them in one sentence to a friend. This turns that sentence
 * into a filled form. It does not create anything.
 *
 * Three rules hold this together, and each exists because the obvious
 * implementation without it is quietly wrong:
 *
 *  1. **The model never produces a coordinate.** It reads place *names* out of
 *     the sentence; Mapbox decides where those names are, through the same
 *     `resolvePlace` the search screen uses. A model asked for a lat/lng will
 *     happily supply one, and it will be a fluent, well-formed coordinate in
 *     the wrong part of the city. Nothing downstream could catch that, and the
 *     user confirming the draft would be reading a correct-looking name.
 *
 *  2. **The model never does date arithmetic against an unknown "now".** It is
 *     told today's date and returns a plain calendar date and clock time; the
 *     instant is computed here.
 *
 *  3. **Nothing it returns is trusted as final.** Every field is validated,
 *     every place re-resolved, and the whole thing is handed to the user as a
 *     pre-filled form they confirm. This is the one rule that makes the other
 *     two recoverable: when extraction is wrong, the user sees it and edits it,
 *     because there is a screen between this and a real squad.
 */

/**
 * Purposes the create flow offers.
 *
 * Mirrors SQUAD_PURPOSES in `lib/squad-purpose.ts`. Deliberately excludes the
 * legacy `study` and `hostel`: stored squads still carry them and the create
 * endpoint still accepts them, but nothing new should be made with them, and a
 * model free to choose them would make new ones every day.
 */
export const INTENT_PURPOSES = [
  'exam', 'college', 'office', 'shopping', 'travel',
  'event', 'concert', 'sports', 'general',
] as const;

export type IntentPurpose = (typeof INTENT_PURPOSES)[number];

/**
 * How the model says "the sentence did not give a purpose".
 *
 * A value in the enum rather than a null union — see the JSON schema below for
 * what that costs when it is a null. Never a real purpose: `asPurpose` does not
 * recognise it and so returns null, exactly as it would for any other string
 * outside the list.
 */
const UNSPECIFIED_PURPOSE = 'unspecified';

/**
 * Capacities the create form offers, including the leader.
 *
 * Mirrors SQUAD_CAPACITIES in `lib/squad-draft.ts`. A count that is not on the
 * ladder is rounded *up* to one that is — someone saying "there are seven of
 * us" needs eight seats, and rounding down would silently leave one behind.
 */
const CAPACITIES = [2, 3, 4, 5, 6, 8, 10] as const;

/**
 * What comes back from the model, accepted loosely and normalised field by
 * field afterwards.
 *
 * This was a strict schema — each field typed and pattern-matched, the whole
 * object rejected if any part of it failed. Against the live API that turned
 * out to be the wrong shape of validation, for a reason worth writing down: a
 * single soft field arriving malformed threw away a destination, an origin and
 * a departure time that were all perfectly good. Three of six test sentences
 * were lost that way, and the user saw an empty form rather than a nearly
 * complete one.
 *
 * So the object-level parse now succeeds whenever the JSON parses at all, and
 * every field is coerced on its own below. A junk `purpose` costs the purpose.
 * It does not cost the trip.
 */
const modelOutput = z.object({
  destinationName: z.unknown(),
  originName: z.unknown(),
  departDate: z.unknown(),
  departTime: z.unknown(),
  purpose: z.unknown(),
  partySize: z.unknown(),
});

/** A place name, or null for anything that is not usable text. */
function asName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 120) return null;
  // Models sometimes answer the literal word for absence rather than a JSON
  // null. Geocoding "null" returns a real place somewhere, so it is caught here.
  if (/^(null|none|n\/a|unknown|not specified)$/i.test(trimmed)) return null;
  return trimmed;
}

/** `YYYY-MM-DD`, or null. */
function asDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
}

/**
 * A 24-hour clock time, normalised to `HH:MM`.
 *
 * `H:MM` is accepted and padded rather than rejected: the model was asked for
 * two digits and does give them, but "9:00" is one sampling wobble away and
 * losing a correct departure time over a missing zero would be absurd.
 */
function asTime(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * A purpose from the create flow's own list, or null.
 *
 * Anything unrecognised becomes null rather than an error. The purpose is the
 * least consequential field in the draft — it picks an icon and seeds a name
 * the leader can retype — so it is the last thing that should be allowed to
 * invalidate a whole extraction.
 */
function asPurpose(value: unknown): IntentPurpose | null {
  if (typeof value !== 'string') return null;
  const lowered = value.trim().toLowerCase();
  return (INTENT_PURPOSES as readonly string[]).includes(lowered)
    ? (lowered as IntentPurpose)
    : null;
}

/** A believable headcount, or null. */
function asPartySize(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 50) return null;
  return parsed;
}

const JSON_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  // Strict schema mode requires every property to be listed as required;
  // "absent" is expressed as an explicit null, which is why every type below
  // is a union with 'null' rather than a field that may be missing.
  required: [
    'destinationName', 'originName', 'departDate',
    'departTime', 'purpose', 'partySize',
  ],
  properties: {
    destinationName: { type: ['string', 'null'], description: 'Where they are going, exactly as written.' },
    originName: { type: ['string', 'null'], description: 'Where they are starting from, exactly as written.' },
    departDate: { type: ['string', 'null'], description: 'Local date, YYYY-MM-DD.' },
    departTime: { type: ['string', 'null'], description: 'Local 24-hour time, HH:MM.' },
    /**
     * A plain string enum with a sentinel, rather than a nullable one.
     *
     * This field has now failed two ways, and the middle path is the third
     * attempt. `enum: [...purposes, null]` beside `type: ["string","null"]`
     * destabilised generation at exactly this property — measured responses
     * stopped mid-object immediately after `"purpose"`, or emitted a stray
     * comma there, on calls reporting `finish_reason: "stop"` and 1,289 of
     * 3,000 tokens. Dropping the enum and describing the options in prose fixed
     * the malformed JSON and lost the extraction instead: purpose came back
     * null on every sentence, including "maths exam".
     *
     * So the options stay enumerated, where they demonstrably do the work, and
     * "not stated" is carried as a value in the list instead of as a null
     * union. Nothing about the type is ambiguous, and `asPurpose` maps the
     * sentinel — like any other unrecognised string — back to null.
     */
    purpose: {
      type: 'string',
      enum: [...INTENT_PURPOSES, UNSPECIFIED_PURPOSE],
      description: 'The reason for the trip, or "unspecified" if the sentence does not say.',
    },
    partySize: { type: ['integer', 'null'], description: 'People travelling, including the speaker.' },
  },
};

function systemPrompt(todayLocal: string): string {
  return [
    'You read one sentence describing a trip and extract only what it actually says.',
    'The writer may use English, Hindi, Tamil, Telugu, Kannada, Malayalam, romanised script, or a mix of these with English.',
    '',
    `Today is ${todayLocal} in the writer's local time.`,
    'Resolve "today", "tomorrow", "day after", "kal", "naalai" and similar against that date.',
    '',
    'Rules:',
    '- Copy place names exactly as written. Do not translate, expand, correct or complete them.',
    '- Never output coordinates, latitudes, longitudes, addresses or postcodes.',
    '- Use null for anything not stated. Do not guess a destination, a time, or a purpose that is not there.',
    '- "morning" alone is not a time. Only fill departTime when a clock time is given.',
    '- purpose is the reason for the trip, not the mode of travel.',
    `- Answer "${UNSPECIFIED_PURPOSE}" for purpose unless the sentence states a reason. Going somewhere is not a reason.`,
    '- If the input is not a description of a trip, every field is null or "unspecified".',
  ].join('\n');
}

export interface ExtractInput {
  /** What the user typed. Never logged. */
  text: string;
  /** Where they are, for biasing place resolution. */
  near: { lat: number; lng: number } | null;
  /** Minutes to add to UTC for the caller's local time, per `getTimezoneOffset` inverted. */
  utcOffsetMinutes: number;
  /** Injected so tests are not clock-dependent. */
  now?: Date;
}

export interface DraftPlace {
  lng: number;
  lat: number;
  label: string;
  address: string | null;
  featureType: string | null;
}

export interface ExtractedDraft {
  destination: DraftPlace | null;
  origin: DraftPlace | null;
  /** ISO instant, always in the future, or null. */
  departAt: string | null;
  purpose: IntentPurpose | null;
  capacity: number | null;
  /**
   * Names the sentence contained that could not be placed on the map.
   *
   * Surfaced rather than dropped: "I couldn't find 'Fortune Tower' — search for
   * it?" is a useful screen, and a silently empty destination field after the
   * user clearly named one reads as the feature being broken.
   */
  unresolved: string[];
  /**
   * False when nothing at all could be extracted.
   *
   * The caller uses this to decide between showing a pre-filled form and
   * showing the ordinary empty one. It is not a confidence score — there is no
   * honest way to produce one here, and a number on screen would imply a
   * precision this does not have.
   */
  understood: boolean;
}

const EMPTY: ExtractedDraft = {
  destination: null,
  origin: null,
  departAt: null,
  purpose: null,
  capacity: null,
  unresolved: [],
  understood: false,
};

/** Longest sentence worth sending. Beyond this it is not a trip description. */
const MAX_INPUT = 500;

export async function extractSquadDraft(input: ExtractInput): Promise<ExtractedDraft> {
  const text = input.text.trim();
  if (!text || text.length > MAX_INPUT) return EMPTY;
  if (!isSarvamConfigured()) return EMPTY;

  const now = input.now ?? new Date();
  const offset = clampOffset(input.utcOffsetMinutes);

  const extracted = await chatJson({
    label: 'squad-intent',
    system: systemPrompt(localDateString(now, offset)),
    user: text,
    schema: modelOutput,
    jsonSchema: JSON_SCHEMA,
  });

  if (!extracted) return EMPTY;

  // Each field stands or falls on its own — see `modelOutput`.
  const destinationName = asName(extracted.destinationName);
  const originName = asName(extracted.originName);

  /**
   * Both places are resolved in one round trip rather than in sequence. They
   * are independent lookups and the user is watching a spinner; doing them one
   * after the other doubles the wait for no benefit.
   */
  const [destination, origin] = await Promise.all([
    destinationName ? resolvePlace(destinationName, input.near) : null,
    originName ? resolvePlace(originName, input.near) : null,
  ]);

  const unresolved: string[] = [];
  if (destinationName && !destination) unresolved.push(destinationName);
  if (originName && !origin) unresolved.push(originName);

  const departAt = toInstant(
    asDate(extracted.departDate),
    asTime(extracted.departTime),
    offset,
    now,
  );
  const capacity = toCapacity(asPartySize(extracted.partySize));

  const draft: ExtractedDraft = {
    destination: toDraftPlace(destination),
    origin: toDraftPlace(origin),
    departAt,
    purpose: asPurpose(extracted.purpose),
    capacity,
    unresolved,
    understood: false,
  };

  draft.understood = isUnderstood(draft);

  return draft;
}

/**
 * Whether the sentence actually described a trip.
 *
 * Purpose is deliberately excluded, and it is the only field that is. The model
 * will not say "unspecified" however plainly it is asked to: given "asdfghjkl"
 * it answers `travel`, and given a bare destination it answers `travel` too.
 * Counting that as understanding meant gibberish came back `understood: true`,
 * which put a filled-in purpose on the create form and told the user their
 * nonsense had been read as a trip.
 *
 * Every other field is real evidence. An unresolvable place name counts as
 * well — it says the sentence named somewhere, even though the map could not
 * place it, and the right response is to ask about that name rather than to
 * start from blank.
 *
 * Exported because it is the rule that decides whether a screen full of
 * prefilled fields appears, and that is worth checking directly rather than
 * through a metered network call.
 */
export function isUnderstood(draft: {
  destination: DraftPlace | null;
  origin: DraftPlace | null;
  departAt: string | null;
  capacity: number | null;
  unresolved: string[];
}): boolean {
  return (
    draft.destination !== null ||
    draft.origin !== null ||
    draft.departAt !== null ||
    draft.capacity !== null ||
    draft.unresolved.length > 0
  );
}

function toDraftPlace(place: ResolvedPlace | null): DraftPlace | null {
  if (!place) return null;
  return {
    lng: place.center[0],
    lat: place.center[1],
    label: place.name,
    address: place.address,
    featureType: place.featureType,
  };
}

/**
 * Party size to a capacity the form actually offers.
 *
 * "Just me" is a real answer and means a squad of one plus whoever joins, so a
 * party of 1 becomes the smallest squad rather than nothing. Anything above the
 * ladder is capped at its top rather than rejected — someone saying "about
 * twenty of us" should get the largest option and a chance to change it, not an
 * empty field.
 */
export function toCapacity(partySize: number | null): number | null {
  if (partySize === null) return null;
  return CAPACITIES.find((option) => option >= partySize) ?? CAPACITIES[CAPACITIES.length - 1];
}

/**
 * An offset outside the real range means a broken or hostile client, and
 * trusting it would shift every extracted time by up to days. UTC-12..UTC+14
 * covers every zone in use.
 */
export function clampOffset(minutes: number): number {
  if (!Number.isFinite(minutes)) return 0;
  return Math.max(-12 * 60, Math.min(14 * 60, Math.trunc(minutes)));
}

/** Today's date in the caller's local terms, for the prompt. */
function localDateString(now: Date, offsetMinutes: number): string {
  const local = new Date(now.getTime() + offsetMinutes * 60_000);
  return local.toISOString().slice(0, 10);
}

/**
 * A local date and clock time to a real instant.
 *
 * The offset is the caller's *current* one, applied to a date that may be a few
 * days out. That is exact in India, which has no daylight saving, and can be an
 * hour off for a user abroad booking across a DST boundary. Accepted knowingly:
 * the alternative is a timezone database on the server for a field the user is
 * about to see written out in full and can correct in one tap.
 *
 * A time without a date means today; a date without a time means the date is
 * known but the departure is not, which the form shows as a date with the time
 * still to pick — so that case returns null rather than assuming midnight, and
 * a squad never gets a 00:00 departure nobody chose.
 */
export function toInstant(
  date: string | null,
  time: string | null,
  offsetMinutes: number,
  now: Date,
): string | null {
  if (!time) return null;

  const day = date ?? localDateString(now, offsetMinutes);
  const [year, month, dayOfMonth] = day.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);

  if (
    !Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(dayOfMonth) ||
    !Number.isFinite(hour) || !Number.isFinite(minute) ||
    month < 1 || month > 12 || dayOfMonth < 1 || dayOfMonth > 31 ||
    hour > 23 || minute > 59
  ) {
    return null;
  }

  const instant = new Date(
    Date.UTC(year, month - 1, dayOfMonth, hour, minute) - offsetMinutes * 60_000,
  );
  if (Number.isNaN(instant.getTime())) return null;

  /**
   * A departure already gone is dropped, not offered.
   *
   * The create form refuses a past departure, so passing one through would
   * produce a pre-filled form that cannot be submitted until the user works out
   * which field is objectionable. Better to arrive with the time blank. This
   * happens for real: "9am" said at 3pm means tomorrow to a person and today to
   * a parser, and the model is told today's date precisely so it resolves that
   * itself — this is the backstop for when it does not.
   */
  if (instant.getTime() <= now.getTime()) return null;

  return instant.toISOString();
}
