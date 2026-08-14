// Relative, with extensions, for the same reason `squad-draft.ts` uses them:
// this module is checked under `node --test`, which resolves specifiers itself
// and knows nothing about the `@/*` paths.
import { suggestSquadName } from './squad-purpose.ts';
import type { PickedPlace } from '@/components/shared/place-picker';
import type { SquadType } from '@/types';

/**
 * The assistant's memory, and the rule for what it asks next.
 *
 * Pure, and deliberately so: this decides what a person is asked, in what
 * order, and when they stop being asked anything. Those are the questions where
 * a bug is a real cost — being asked for a destination you already gave, or
 * being asked nothing and landing on a confirmation card with a field missing —
 * and none of it should need a browser or a network call to check.
 *
 * The interaction layer renders these questions and animates the answers. It
 * does not decide them.
 */

/** Everything the assistant can learn. Mirrors the create form's own state. */
export interface ConciergeSlots {
  destination: PickedPlace | null;
  /**
   * Where they are setting off from.
   *
   * Has no input on the create form, and is still worth asking for: it biases
   * destination and meeting-point search, and it is half of what makes a
   * "same way" suggestion meaningful.
   */
  origin: PickedPlace | null;
  /** Local calendar date, `YYYY-MM-DD`. */
  departDate: string | null;
  /** Local 24-hour time, `HH:MM`. */
  departTime: string | null;
  purpose: SquadType | null;
  meetingPoint: PickedPlace | null;
}

export const EMPTY_SLOTS: ConciergeSlots = {
  destination: null,
  origin: null,
  departDate: null,
  departTime: null,
  purpose: null,
  meetingPoint: null,
};

/**
 * Which question is being asked. `date` and `time` both fill the departure, so
 * they are separate steps over one value rather than two values.
 */
export type SlotKey = keyof ConciergeSlots;

export interface ConciergeState {
  slots: ConciergeSlots;
  /**
   * Answers the user declined to give.
   *
   * Tracked separately from "not known", because the two must behave
   * differently: an unknown slot is asked for, a skipped one never is again.
   * Without this the assistant re-asks the question somebody has just refused,
   * which is the single most irritating thing a form can do.
   */
  skipped: SlotKey[];
}

export const INITIAL_STATE: ConciergeState = { slots: EMPTY_SLOTS, skipped: [] };

export type QuestionKind = 'place' | 'date' | 'time' | 'purpose' | 'meeting';

export interface Question {
  slot: SlotKey;
  kind: QuestionKind;
  /** Asked in the assistant's own voice. */
  prompt: string;
  /** Whether "skip" is offered. The destination is the one thing it is not. */
  skippable: boolean;
}

/**
 * The order questions are asked in.
 *
 * Destination first because it is what a squad *is*, and because every later
 * question is easier to answer once it is known — meeting-point search biases
 * to it, and the name is built from it. Meeting point last because it is the
 * only one with a sensible automatic answer, so it is the one most people
 * should be able to skip having already got what they came for.
 */
const ORDER: { slot: SlotKey; kind: QuestionKind; prompt: string; skippable: boolean }[] = [
  { slot: 'destination', kind: 'place', prompt: 'Where are you going?', skippable: false },
  { slot: 'origin', kind: 'place', prompt: 'Where are you starting from?', skippable: true },
  { slot: 'departDate', kind: 'date', prompt: 'When are you leaving?', skippable: true },
  { slot: 'departTime', kind: 'time', prompt: 'What time?', skippable: true },
  { slot: 'purpose', kind: 'purpose', prompt: "What's the trip for?", skippable: true },
  { slot: 'meetingPoint', kind: 'meeting', prompt: 'Where should everyone meet?', skippable: true },
];

/**
 * The next thing to ask, or null when there is nothing left.
 *
 * A slot that is filled is never asked about, and neither is one that was
 * skipped — which together are the whole promise of "never ask for a field that
 * is already known". A sentence that answered five of the six questions
 * therefore produces exactly one.
 */
export function nextQuestion(state: ConciergeState): Question | null {
  for (const step of ORDER) {
    if (state.slots[step.slot] !== null) continue;
    if (state.skipped.includes(step.slot)) continue;

    /**
     * Time is not asked without a date.
     *
     * "What time?" on its own has no answer that can be stored — a clock time
     * with no day is not a departure — so if the date was skipped, the time
     * goes with it rather than being collected and discarded.
     */
    if (step.slot === 'departTime' && state.slots.departDate === null) continue;

    return step;
  }
  return null;
}

/** True once a squad could actually be created from what is known. */
export function isReady(state: ConciergeState): boolean {
  return state.slots.destination !== null;
}

/** One line in the conversation. */
export interface ChatTurn {
  id: string;
  role: 'ai' | 'user';
  text: string;
}

/**
 * The conversation so far, derived from the slots rather than recorded.
 *
 * Deriving it is the whole point. A separate transcript array would be a second
 * source of truth for what has been agreed, and the two would drift the first
 * time an answer was changed — leaving a chat that says "Taramani" above a
 * squad going to Velachery. Here the bubbles cannot disagree with the state,
 * because they *are* the state.
 *
 * `opening` is the sentence the user typed to start, which has no slot of its
 * own and would otherwise vanish from a conversation it began.
 */
export function buildTranscript(state: ConciergeState, opening?: string): ChatTurn[] {
  const turns: ChatTurn[] = [];

  if (opening?.trim()) {
    turns.push({ id: 'opening', role: 'user', text: opening.trim() });
  }

  for (const step of ORDER) {
    const value = state.slots[step.slot];
    const wasSkipped = state.skipped.includes(step.slot);
    if (value === null && !wasSkipped) continue;

    // A time skipped only because the date was skipped never got asked, so it
    // would be a question in the transcript that nobody was shown.
    if (step.slot === 'departTime' && wasSkipped && state.skipped.includes('departDate')) {
      continue;
    }

    turns.push({ id: `${step.slot}-q`, role: 'ai', text: step.prompt });
    turns.push({
      id: `${step.slot}-a`,
      role: 'user',
      text: value === null ? 'Skip for now' : describeAnswer(step.slot, value),
    });
  }

  return turns;
}

/** An answer as the person would say it back, not as it is stored. */
function describeAnswer(slot: SlotKey, value: ConciergeSlots[SlotKey]): string {
  if (slot === 'purpose') return purposeWord(value as SquadType);
  if (slot === 'departDate') return readableDate(value as string);
  if (slot === 'departTime') return readableTime(value as string);
  const place = value as PickedPlace;
  return place.label.split(',')[0] || place.label;
}

const PURPOSE_WORDS: Partial<Record<SquadType, string>> = {
  exam: 'Exam', college: 'College', office: 'Office', shopping: 'Shopping',
  travel: 'Travel', event: 'Event', concert: 'Concert', sports: 'Sports',
  general: 'Something else',
};

function purposeWord(value: SquadType): string {
  return PURPOSE_WORDS[value] ?? 'Something else';
}

/** "Today" and "Tomorrow" by name; anything further off by its weekday. */
export function readableDate(key: string): string {
  const when = new Date(`${key}T00:00:00`);
  if (Number.isNaN(when.getTime())) return key;

  const today = new Date();
  const midnight = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const days = Math.round((midnight(when) - midnight(today)) / 86_400_000);

  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return when.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
}

export function readableTime(key: string): string {
  const [hour, minute] = key.split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return key;
  const when = new Date();
  when.setHours(hour!, minute!, 0, 0);
  return when.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** Records an answer, and stops the slot being asked about again. */
export function answer<K extends SlotKey>(
  state: ConciergeState,
  slot: K,
  value: ConciergeSlots[K],
): ConciergeState {
  return {
    slots: { ...state.slots, [slot]: value },
    // An answered slot leaves the skip list: someone who skipped the time and
    // then went back and set one has plainly changed their mind.
    skipped: state.skipped.filter((key) => key !== slot),
  };
}

/**
 * Declines a question.
 *
 * Skipping the date takes the time with it, because a time with no day cannot
 * be stored — the same rule `nextQuestion` applies, enforced here too so the
 * state is truthful on its own rather than only when read in order.
 */
export function skip(state: ConciergeState, slot: SlotKey): ConciergeState {
  const also: SlotKey[] = slot === 'departDate' ? ['departTime'] : [];
  const additions = [slot, ...also].filter((key) => !state.skipped.includes(key));
  return { ...state, skipped: [...state.skipped, ...additions] };
}

/**
 * Whether a typed line needs the language model at all.
 *
 * This is the decision that keeps the assistant usable. Extraction costs ten to
 * thirty-five seconds and real money, and most answers do not need it: "taramani"
 * is a place name, and the right way to turn a place name into a place is the
 * map, not a 105-billion-parameter model. Sending it to one would be slower,
 * more expensive and *less* accurate, since Mapbox is what resolves it either
 * way.
 *
 * So the model is reserved for what only it can do — reading a whole trip out
 * of a sentence, in any of several languages and scripts. Everything else is
 * answered locally.
 *
 * Wrong in the cheap direction on purpose: a sentence misread as a place name
 * costs one extra question, while a place name misread as a sentence costs half
 * a minute of staring at a spinner.
 */
const TIME_HINTS =
  /\b(today|tomorrow|tonight|morning|afternoon|evening|night|kal|aaj|naalai|indru|am|pm|o'?clock|\d{1,2}\s*[:.]\s*\d{2}|\d{1,2}\s*(am|pm)|baje|mani|manikku)\b/i;
const JOURNEY_HINTS =
  /\b(from|to|going|go|need|want|leave|leaving|reach|travel|ride|trip|se|tak|ku|il|irundhu|jaana|jana|chahiye|ponum|pogonum|venum)\b/i;
const PURPOSE_HINTS =
  /\b(exam|test|class|college|office|work|meeting|event|concert|match|shopping|movie|interview)\b/i;

export function needsInterpretation(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  if (TIME_HINTS.test(trimmed)) return true;
  if (JOURNEY_HINTS.test(trimmed)) return true;
  if (PURPOSE_HINTS.test(trimmed)) return true;

  /**
   * Length as the last resort, counted in words.
   *
   * A place can genuinely be four words ("Anna University Research Park"), so
   * the threshold sits above that. Below it, with none of the hints above, the
   * only sensible reading is that somebody typed where they are going.
   */
  return trimmed.split(/\s+/).length > 5;
}

/**
 * What the confirmation card shows, built from the slots alone.
 *
 * The squad name comes from `suggestSquadName`, the same function the manual
 * form uses — so a squad created through the assistant and one created by hand
 * from identical answers get identical names.
 */
export interface TripSummary {
  name: string;
  destinationLabel: string | null;
  originLabel: string | null;
  departAt: Date | null;
  purpose: SquadType;
  meetingLabel: string | null;
  /** True when the meeting point is the destination by default, not by choice. */
  meetingIsDefault: boolean;
}

/** The purpose a squad gets when nobody said. Matches the manual form's default. */
export const DEFAULT_PURPOSE: SquadType = 'general';

export function summarise(state: ConciergeState): TripSummary {
  const { destination, origin, purpose, meetingPoint } = state.slots;
  const effectivePurpose = purpose ?? DEFAULT_PURPOSE;

  return {
    name: destination ? suggestSquadName(destination.label, effectivePurpose) : '',
    destinationLabel: destination ? shortPlace(destination.label) : null,
    originLabel: origin ? shortPlace(origin.label) : null,
    departAt: combineDeparture(state.slots.departDate, state.slots.departTime),
    purpose: effectivePurpose,
    meetingLabel: meetingPoint
      ? shortPlace(meetingPoint.label)
      : destination
        ? shortPlace(destination.label)
        : null,
    meetingIsDefault: meetingPoint === null,
  };
}

function shortPlace(label: string): string {
  return label.split(',')[0]?.trim() || label;
}

/**
 * A local date and a local time into one instant, or null.
 *
 * Null when either half is missing, and specifically **not** midnight when only
 * the date is known: a squad departing 00:00 is one nobody chose, and the
 * manual form leaves the time blank in exactly that case.
 *
 * Built with the local `Date` constructor rather than by arithmetic on UTC, so
 * the browser applies its own zone and the result is the instant the user meant
 * on their own clock.
 */
export function combineDeparture(date: string | null, time: string | null): Date | null {
  if (!date || !time) return null;

  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  if (
    !Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day) ||
    !Number.isFinite(hour) || !Number.isFinite(minute)
  ) {
    return null;
  }

  const when = new Date(year!, month! - 1, day!, hour!, minute!, 0, 0);
  return Number.isNaN(when.getTime()) ? null : when;
}

/** `YYYY-MM-DD` for a local date, without going through UTC. */
export function localDateKey(when: Date): string {
  const month = String(when.getMonth() + 1).padStart(2, '0');
  const day = String(when.getDate()).padStart(2, '0');
  return `${when.getFullYear()}-${month}-${day}`;
}

/** `HH:MM` for a local time. */
export function localTimeKey(when: Date): string {
  return `${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}`;
}

/**
 * Folds an AI-2 extraction into the assistant's memory.
 *
 * Only fills what is still empty. Someone who answered two questions and then
 * described the rest in a sentence keeps their two answers — the model's
 * reading of a sentence is a weaker signal than a person tapping a choice, and
 * where they disagree the person wins.
 *
 * Coordinates arrive already resolved by Mapbox on the server. Nothing here
 * invents one, and nothing here may: a place with no coordinate is left null so
 * it gets asked about.
 */
export function applyExtraction(
  state: ConciergeState,
  draft: {
    destination: { lng: number; lat: number; label: string; address: string | null; featureType: string | null } | null;
    origin: { lng: number; lat: number; label: string; address: string | null; featureType: string | null } | null;
    departAt: string | null;
    purpose: SquadType | null;
  },
): ConciergeState {
  const slots = { ...state.slots };

  if (slots.destination === null && draft.destination) {
    slots.destination = toPlace(draft.destination);
  }
  if (slots.origin === null && draft.origin) {
    slots.origin = toPlace(draft.origin);
  }
  if (slots.purpose === null && draft.purpose) {
    slots.purpose = draft.purpose;
  }

  if (draft.departAt) {
    const when = new Date(draft.departAt);
    if (!Number.isNaN(when.getTime())) {
      if (slots.departDate === null) slots.departDate = localDateKey(when);
      if (slots.departTime === null) slots.departTime = localTimeKey(when);
    }
  }

  return { ...state, slots };
}

function toPlace(value: {
  lng: number;
  lat: number;
  label: string;
  address: string | null;
  featureType: string | null;
}): PickedPlace {
  return {
    lng: value.lng,
    lat: value.lat,
    label: value.label,
    address: value.address,
    ...(value.featureType ? { featureType: value.featureType } : {}),
  };
}
