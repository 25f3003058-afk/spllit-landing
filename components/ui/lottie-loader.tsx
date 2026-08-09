'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useSyncExternalStore } from 'react';

import { cn } from '@/lib/utils';

/**
 * lottie-web needs a real canvas, so the player never server-renders. Declared
 * at module scope, not inside the component, or every render would create a new
 * lazy component and remount the animation from frame zero.
 */
const LottiePlayer = dynamic(() => import('@/components/ui/lottie-player'), {
  ssr: false,
});

/**
 * Which artwork, chosen by what is being waited for rather than by where the
 * loader sits. `host` and `squad` are the two products the trip search splits
 * into; `generic` is for waits that are neither — the map bundle, a place
 * lookup — where a scooter would be claiming something untrue.
 */
export type LottieLoaderVariant = 'host' | 'squad' | 'generic';

const SOURCES: Record<LottieLoaderVariant, string> = {
  host: '/lottie/host-scooter.json',
  squad: '/lottie/squad-driver.json',
  generic: '/lottie/generic-loading.json',
};

/**
 * Fetched rather than imported.
 *
 * These are 126–192 kB of JSON each. Imported, they would be inlined into a
 * route chunk that every visitor downloads and TypeScript would try to infer a
 * literal type for each one, which is slow enough to notice on `tsc`. As static
 * files they are cached by the CDN, shared between routes, and only fetched by
 * someone who actually waits for something.
 *
 * The promise — not the resolved value — is what is cached, so two loaders
 * mounting in the same tick share one request, and so the resolved object keeps
 * a stable identity. That identity is what stops lottie-web from tearing down
 * and rebuilding the animation when the parent re-renders.
 */
const cache = new Map<string, Promise<unknown>>();

function loadAnimation(src: string): Promise<unknown> {
  let pending = cache.get(src);
  if (!pending) {
    pending = fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`Lottie ${src} returned ${res.status}`);
        return res.json() as Promise<unknown>;
      })
      .catch((err: unknown) => {
        // Don't poison the cache — a loader mounted after a transient failure
        // should get to try again rather than inherit the rejection forever.
        cache.delete(src);
        throw err;
      });
    cache.set(src, pending);
  }
  return pending;
}

/**
 * Warms the cache before the loader exists.
 *
 * Called when the search is submitted: the animation then downloads alongside
 * the route chunk instead of after it, so by the time /trips renders its
 * pending state the artwork is usually already in hand.
 */
export function prefetchLottie(variant: LottieLoaderVariant): void {
  if (typeof window === 'undefined') return;
  // Same width gate the loader applies. Without it the one caller left on a
  // phone would download artwork for a loader that will never be built —
  // the worst version of this feature, paid for and never seen.
  if (!window.matchMedia(DESKTOP).matches) return;
  void loadAnimation(SOURCES[variant]).catch(() => {
    // Prefetch is opportunistic; the loader will surface a real failure by
    // simply showing the skeletons on their own.
  });
}

/**
 * Reserved boxes, not intrinsic sizing.
 *
 * The animation arrives a moment after the caption, so the box it will land in
 * has to exist first — otherwise the text under it jumps by the full height of
 * the artwork the instant the JSON resolves. `sm` is for loaders that sit
 * inside another element (a map pane); `md` is the standalone results wait.
 *
 * No responsive variants: this component only ever renders above DESKTOP, so a
 * phone-sized step would be dead CSS describing a state that cannot happen.
 */
const SIZES = {
  sm: 'h-[124px] w-[124px]',
  md: 'h-[190px] w-[190px]',
} as const;

/**
 * The animation is a desktop-only affordance.
 *
 * On a laptop the results column is capped at max-w-2xl and centred, so a wait
 * is mostly empty page and the artwork is filling space that was doing nothing.
 * A phone has no such space — the search controls and the dock already reach
 * both edges of the viewport, and an illustration there pushes the first result
 * card down for no gain. Phones get exactly the screen they had before this
 * component existed: skeletons, nothing else.
 *
 * 1024px rather than the tablet breakpoint because that is where the fixed
 * 672px column stops filling the viewport and the margins start being the thing
 * you notice.
 *
 * Gated in JS rather than with `hidden lg:flex` deliberately. `display: none`
 * still mounts the component, still fetches 126–192 kB of JSON and still has
 * lottie-web painting frames into a box nobody can see — the exact "running
 * invisibly" cost the loader is written to avoid. Below this width the element
 * is never created and neither request is ever made.
 */
const DESKTOP = '(min-width: 1024px)';

function subscribeDesktop(onChange: () => void): () => void {
  const query = window.matchMedia(DESKTOP);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function getIsDesktop(): boolean {
  return window.matchMedia(DESKTOP).matches;
}

// The server has no viewport. Assuming "not desktop" makes the server output
// and the first client render agree on rendering nothing, so there is no
// hydration mismatch; desktop then paints the loader on the pass straight
// after, well before the JSON could have arrived anyway.
function getIsDesktopOnServer(): boolean {
  return false;
}

/**
 * `prefers-reduced-motion` read as an external store rather than mirrored into
 * state by an effect.
 *
 * It cannot be honoured in CSS here: globals.css collapses CSS animation
 * durations, but lottie-web drives its own frames from rAF and ignores that
 * entirely. It has to reach the render as a value.
 */
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function getReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION).matches;
}

// The server cannot know the preference. Assuming "not reduced" matches the
// client default and keeps the first client render from mismatching for the
// overwhelming majority; anyone who has set it gets a corrected second render
// before lottie-web is even loaded.
function getReducedMotionOnServer(): boolean {
  return false;
}

/**
 * An animated illustration with a line of text under it, for waits long enough
 * that a spinner reads as a stall.
 *
 * It says "the app is working"; the skeletons a caller puts below it say "the
 * answer will appear here". Neither is a substitute for the other, and neither
 * is a substitute for an empty state — this component must only ever be
 * rendered while a request is genuinely in flight, so that when the request
 * finishes with nothing, the screen says so in words.
 */
export function LottieLoader({
  variant,
  caption,
  size = 'md',
  className,
}: {
  variant: LottieLoaderVariant;
  caption: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const src = SOURCES[variant];

  /**
   * The source is stored alongside the data, and the match is checked at render
   * rather than cleared by the effect.
   *
   * Switching Host to Squad has to swap the artwork, and the obvious way to do
   * that — reset the state at the top of the effect — is a synchronous setState
   * in an effect body, which costs a second render pass on every mount. Holding
   * both and comparing gets the same guarantee (the scooter is never shown for
   * a squad search) from the render that already had to happen.
   */
  const [loaded, setLoaded] = useState<{ src: string; data: unknown } | null>(null);
  const animationData = loaded?.src === src ? loaded.data : null;

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getReducedMotionOnServer,
  );

  const isDesktop = useSyncExternalStore(subscribeDesktop, getIsDesktop, getIsDesktopOnServer);

  useEffect(() => {
    // The width check belongs here as well as in the render: returning early
    // below would still leave this effect fetching 126–192 kB on a phone that
    // has no intention of drawing it.
    if (!isDesktop) return;
    let live = true;
    loadAnimation(src)
      .then((data) => {
        if (live) setLoaded({ src, data });
      })
      .catch(() => {
        // Leave the box empty. The caption and the skeletons below still say
        // the screen is loading, so a missing decoration is not worth an error.
      });
    return () => {
      live = false;
    };
  }, [src, isDesktop]);

  // Below 1024px the wait is the skeletons alone, exactly as it was before this
  // component existed. Hooks run first so this stays a legal early return.
  if (!isDesktop) return null;

  return (
    <div
      // One live region for the whole loader, announcing the caption rather
      // than the artwork. Assistive tech gets "Finding nearby hosts", not a
      // description of a scooter.
      role="status"
      aria-live="polite"
      className={cn('flex flex-col items-center justify-center text-center', className)}
    >
      <div className={cn('shrink-0', SIZES[size])}>
        {animationData ? (
          <LottiePlayer
            animationData={animationData}
            play={!reducedMotion}
            className="h-full w-full"
          />
        ) : null}
      </div>
      {/* max-w keeps the caption to one or two lines at 320px instead of
          wrapping into a paragraph, and text-balance splits it evenly. */}
      <p className="mt-1 max-w-[22ch] text-balance text-[13px] leading-relaxed text-ink-muted">
        {caption}
      </p>
    </div>
  );
}
