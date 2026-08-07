'use client';

import dynamic from 'next/dynamic';

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
    loading: () => <SkeletonMap />,
  },
);

export function MapCanvas(props: SplitMapProps) {
  return <SplitMapClient {...props} />;
}
