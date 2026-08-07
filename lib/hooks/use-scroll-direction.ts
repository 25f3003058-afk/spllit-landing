'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * True while the user is reading downward, so a floating bar can get out of
 * the way and come back the moment they scroll up.
 *
 * Reads on a rAF rather than on every scroll event: scroll fires far faster
 * than the screen repaints, and setting state per event is what turns a bar
 * like this into jank on a phone.
 */
export function useHidingOnScroll({
  /** Movement below this is ignored, so a trackpad twitch cannot flicker the bar. */
  threshold = 8,
  /** Always visible near the top — there is nothing to read past yet. */
  revealAbove = 64,
}: { threshold?: number; revealAbove?: number } = {}) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastY.current = window.scrollY;

    const evaluate = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;

      if (y <= revealAbove) {
        setHidden(false);
      } else if (Math.abs(delta) > threshold) {
        setHidden(delta > 0);
      }

      // Only commit the reference once a decision was made, otherwise slow
      // scrolling never accumulates past the threshold and the bar never moves.
      if (Math.abs(delta) > threshold) lastY.current = y;
      ticking.current = false;
    };

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      window.requestAnimationFrame(evaluate);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold, revealAbove]);

  return hidden;
}
