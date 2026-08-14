import type { OrbPhase } from '@/components/shared/spllit-ai-orb';

/**
 * Where designed artwork for the assistant plugs in.
 *
 * **This is the file to edit when you have a Lottie animation.** Drop the JSON
 * into `public/lottie/ai/`, put its path against the phase below, and that
 * phase starts using it. Nothing else has to change — no component, no import,
 * no build step.
 *
 * The drawn orb stays the fallback: it paints immediately while the JSON is
 * downloading, and it keeps painting if the fetch fails or a phase has no entry.
 */

export interface OrbArt {
  /** Path under `public/`, so `/lottie/ai/thinking.json`. */
  src: string;
  /**
   * The frame to sit on when the viewer has asked for reduced motion.
   *
   * Not optional guesswork: frame zero is often the emptiest part of an
   * animation, and a still that shows nothing is indistinguishable from a
   * broken one. Pick a frame where the subject is centred and on screen.
   */
  holdFrame: number;
  /**
   * Whether it repeats.
   *
   * The waiting phases have to loop — they run for an unknown length of time,
   * and an animation that stops while the work continues reads as a hang. The
   * reaction phases must not: a celebration that repeats forever stops being a
   * celebration.
   */
  loop: boolean;
}

/**
 * `ufo.json` is a 1000×1000 vector scene, 7.5 s long, ~78 kB — no bitmaps, so it
 * stays sharp at any size, and no solid layer, so it sits on any surface in both
 * themes. It arrived as `UFOs.lottie`, a dotLottie ZIP; the JSON inside it is
 * what lottie-react can actually read, so that is what lives here.
 *
 * It is registered for every phase but one, because it is the assistant's
 * *identity* rather than a loading indicator. An earlier version used it only
 * while a request was in flight, which meant the character appeared for ten
 * seconds in the middle of the flow and was a drawn circle everywhere else —
 * so the one screen built around it, the opening question, never showed it at
 * all. If the UFO is who Spllit AI is, it has to be there when you meet it.
 *
 * The exception is `failed`. A cheerfully flying saucer is the wrong face for
 * "I couldn't read that", and this animation has no unhappy frame to stop on.
 * The drawn orb has one — a flat, apologetic line — so failure keeps it.
 *
 * Everything loops, including `success`: this is a continuous flight with no
 * closing beat, so playing it once would simply freeze mid-air. A looping
 * celebration is a compromise; a frozen one is a bug. A short non-looping
 * reaction would be better, and is the one piece of artwork still worth having.
 */
/**
 * Frame 70 for the still, chosen by counting visible layers across the
 * timeline: 7 at frame 0 against 11 through frames 60-80, because the saucers
 * start off-canvas and fly in. Holding at 0 showed an empty square.
 */
const UFO: OrbArt = { src: '/lottie/ai/ufo.json', loop: true, holdFrame: 70 };

export const ORB_ART: Partial<Record<OrbPhase, OrbArt>> = {
  // One file across all four, so the character never swaps mid-flow and the
  // download is made once and reused from cache.
  idle: UFO,
  thinking: UFO,
  scanning: UFO,
  success: UFO,
};
