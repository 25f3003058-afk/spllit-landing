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
  play,
  className,
}: {
  animationData: unknown;
  /**
   * False under `prefers-reduced-motion`, where the artwork is held on its
   * first frame instead of looping. The illustration still says "this is the
   * hosts screen"; only the movement goes away.
   */
  play: boolean;
  className?: string;
}) {
  return (
    <Lottie
      animationData={animationData}
      loop={play}
      autoplay={play}
      className={className}
      // The animation is decoration over a live region that already announces
      // itself in words — see LottieLoader.
      aria-hidden
      rendererSettings={{
        // The artboards are 543×388, 750×500 and 1200×1200; without this they
        // stretch to whatever box they are given.
        preserveAspectRatio: 'xMidYMid meet',
        progressiveLoad: true,
      }}
    />
  );
}
