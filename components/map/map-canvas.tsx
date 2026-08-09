'use client';

import dynamic from 'next/dynamic';

import { LottieLoader } from '@/components/ui/lottie-loader';
import { SkeletonMap } from '@/components/ui/skeleton';
import type { SplitMapProps } from '@/components/map/split-map';

/**
 * Code-split entry point for the map. mapbox-gl is ~800 kB gzipped and is only
 * pulled in by routes that actually render a map (Section 7.5). SSR is off
 * because GL needs a real canvas.
 *
 * Every consumer imports this, never split-map directly.
 */
const SplitMapClient = dynamic(
  () => import('@/components/map/split-map').then((m) => m.SplitMap),
  {
    ssr: false,
    // The shell renders immediately and the map streams in behind this — the
    // page is never blocked on GL initialisation.
    loading: () => <MapLoading />,
  },
);

/**
 * The 800 kB wait, with something to look at.
 *
 * The generic animation rather than the host or squad one: what is loading here
 * is a map, on routes that show both kinds of pin and on some that show
 * neither. It sits on top of the existing shimmering map surface instead of
 * replacing it — the skeleton is what keeps the pane the right shape while GL
 * initialises, and dropping it would hand back the layout shift it exists to
 * prevent. `sm` because this box is bounded by whatever pane the map was given,
 * which on a phone card is not much.
 */
function MapLoading() {
  return (
    <div className="relative h-full w-full">
      <SkeletonMap />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
        <LottieLoader variant="generic" caption="Loading the map…" size="sm" />
      </div>
    </div>
  );
}

export function MapCanvas(props: SplitMapProps) {
  return <SplitMapClient {...props} />;
}
