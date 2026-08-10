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
}: {
  animationData: unknown;
  className?: string;
}) {
  return (
    <Lottie
      animationData={animationData}
      /**
       * Both hard-coded, and the caller decides whether to render this at all.
       *
       * lottie-react only passes `autoplay` to lottie-web on the load effect,
       * which is keyed on `[animationData, loop]`; a later change to `autoplay`
       * just assigns `instance.autoplay`, which lottie-web reads once at load
       * and never again. So a prop that starts false and flips true leaves a
       * player parked on frame one looking broken. Nothing here is allowed to
       * start paused, which makes that unreachable.
       */
      loop
      autoplay
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
