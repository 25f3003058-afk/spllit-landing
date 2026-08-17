/**
 * When the assistant is allowed to speak first, and what it says.
 *
 * A floating button that says nothing is furniture — people stop seeing it
 * within a visit. A floating button that talks at the wrong moment is worse: it
 * covers what you are reading, interrupts what you were typing, and teaches you
 * to dismiss it before reading it. So the rules for opening its mouth are
 * written here, pure and tested, rather than scattered through a component
 * where "just one more condition" accumulates until nobody knows when it fires.
 *
 * The governing rule is that **it stops permanently once you have engaged**.
 * Opening the assistant, or waving the nudge away, is an answer — and an
 * assistant that asks again after being answered is nagging, not helping.
 */

export interface NudgeContext {
  /** Seconds since the user arrived on this screen. */
  secondsOnPage: number;
  /** True once the assistant has been opened, this session or before. */
  everOpened: boolean;
  /** True once a nudge has been explicitly waved away. */
  dismissed: boolean;
  /** True while the assistant is on screen. */
  isOpen: boolean;
  /** Whether the form already has a destination. */
  hasDestination: boolean;
  /** True while the user is actively typing, so they are not interrupted. */
  isTyping: boolean;
}

export interface Nudge {
  /** Stable across re-renders for the same situation, so it does not flicker. */
  id: string;
  text: string;
}

/**
 * How long someone sits before help is offered.
 *
 * Long enough that anyone who knows what they are doing has already done it —
 * the whole form takes under fifteen seconds to fill if you know the place you
 * are going. Offering at three seconds would interrupt every competent user to
 * help the few who are stuck.
 */
const QUIET_SECONDS = 14;

/** Offered again later, if they are still on the same screen and still stuck. */
const REPEAT_SECONDS = 45;

/**
 * Lines for someone who has not chosen a destination.
 *
 * All phrased as an offer with an obvious "no" — none of them ask a question
 * the user has to answer to make the bubble go away.
 */
const STUCK_LINES = [
  'Want me to set this up for you?',
  'Not sure where to start? I can help.',
  'Tell me your trip and I will fill this in.',
  'Going somewhere? I can do the typing.',
];

/** Lines for someone who has made a start but stalled. */
const HALFWAY_LINES = [
  'Want me to finish the rest?',
  'I can sort the timing if you like.',
  'Need a hand with the details?',
];

/**
 * The nudge to show right now, or null for silence.
 *
 * Null is the common answer and should be: this returns something only for a
 * person who has been sitting on the same screen long enough to look stuck, has
 * never opened the assistant, has not waved it away, and is not mid-keystroke.
 */
export function pickNudge(context: NudgeContext): Nudge | null {
  // Engagement, in either direction, ends this for good.
  if (context.everOpened || context.dismissed || context.isOpen) return null;

  // Never over the top of someone who is busy answering for themselves.
  if (context.isTyping) return null;

  if (context.secondsOnPage < QUIET_SECONDS) return null;

  const lines = context.hasDestination ? HALFWAY_LINES : STUCK_LINES;

  /**
   * Which line, chosen by how long they have been here rather than at random.
   *
   * `Math.random()` would pick a new line on every render — the bubble would
   * shuffle its own text while being read. Deriving it from the clock means it
   * is stable between renders and still changes if the same person stalls
   * twice on the same screen.
   */
  const round = Math.floor((context.secondsOnPage - QUIET_SECONDS) / REPEAT_SECONDS);
  const line = lines[round % lines.length]!;

  return { id: `${context.hasDestination ? 'halfway' : 'stuck'}-${round}`, text: line };
}
