'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Calls `handler` when a pointer press or touch lands outside `ref`.
 *
 * Bound on `mousedown`/`touchstart` rather than `click`: a click fires only
 * after release, so a press that starts outside and drifts inside would keep
 * the element open, and a press that starts inside and releases outside would
 * wrongly close it. Pressing is the intent that matters here.
 *
 * The handler is read through a ref-free dependency because callers almost
 * always pass an inline arrow — listing it directly would rebind the listener
 * on every render.
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  handler: () => void,
): void {
  useEffect(() => {
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const element = ref.current;
      if (!element) return;
      const target = event.target;
      if (target instanceof Node && element.contains(target)) return;
      handler();
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  });
}
