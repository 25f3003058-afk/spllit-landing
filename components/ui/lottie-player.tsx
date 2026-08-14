'use client';

import Lottie from 'lottie-react';

/**
 * The only module in the app that pulls in lottie-web.
 *
 * It is ~250 kB and needs a real DOM to measure and paint into, so it is never
 * imported directly — `lottie-loader.tsx` reaches it through `next/dynamic`
 * with `ssr: false`, which both keeps it out of every route that never shows an
 * animation and keeps it out of the server render. Same rule as the map
 * (Section 7.5): heavy renderers are code-split behind one entry point.
 *
 * Default export on purpose — `next/dynamic` resolves the default.
 */
export default function LottiePlayer({
  animationData,
  className,
  loop = true,
  autoplay = true,
  holdFrame,
}: {
  animationData: unknown;
  className?: string;
  /**
   * Looping is the default because every original caller loops — a loader is
   * not finished until the thing it waits for is.
   *
   * It is a prop rather than a constant for the assistant orb, whose success
   * and failure states are single gestures: a reaction that repeats forever
   * stops reading as a reaction. Safe to vary because lottie-react's load
   * effect is keyed on `[animationData, loop]`, so changing it genuinely
   * reloads the animation.
   */
  loop?: boolean;
  /**
   * False holds the animation on its first frame instead of playing it.
   *
   * This is what `prefers-reduced-motion` should mean for an illustration that
   * is also a character: the artwork is still there, it simply does not move.
   * Refusing to render it at all was the earlier behaviour and it was wrong —
   * on Windows the preference is set by turning off "Animation effects", which
   * plenty of people do for performance, and it left them looking at a blank
   * where the assistant should be.
   */
  autoplay?: boolean;
  /**
   * The frame to hold on when `autoplay` is false.
   *
   * Needed because frame zero is not reliably a picture. This animation opens
   * with most of its cast off-canvas — 7 visible layers at frame 0 against 11
   * in the middle — so holding at the start showed an almost-empty box and read
   * exactly like a failed load. Whoever registers artwork picks a frame where
   * it actually looks like itself.
   */
  holdFrame?: number;
}) {
  /**
   * A paused animation must not also be looping.
   *
   * This is load-bearing, not tidiness. lottie-react's load effect is keyed on
   * `[animationData, loop]` and passes `autoplay` to lottie-web only there — a
   * later change just assigns `instance.autoplay`, which lottie-web read once
   * and never reads again. So an `autoplay` that flips false→true on its own
   * would leave a player parked on frame one looking broken. Folding it into
   * `loop` puts it inside the effect's key, so the flip genuinely reloads.
   */
  const shouldLoop = loop && autoplay;

  return (
    <Lottie
      animationData={animationData}
      loop={shouldLoop}
      autoplay={autoplay}
      {...(!autoplay && holdFrame !== undefined
        ? { initialSegment: [holdFrame, holdFrame + 1] as [number, number] }
        : {})}
      className={className}
      // The animation is decoration over a live region that already announces
      // itself in words — see LottieLoader.
      aria-hidden
      rendererSettings={{
        // The artboards are 543×388, 750×500 and 1200×1200; without this they
        // stretch to whatever box they are given.
        preserveAspectRatio: 'xMidYMid meet',
        // progressiveLoad is deliberately off. It defers building DOM for
        // layers until they are needed, which is a saving worth having on a
        // hundred-layer artboard and a liability on a 33-layer one that also
        // contains a precomp: the win is invisible and the failure mode is an
        // animation that renders and then does not move.
      }}
    />
  );
}
