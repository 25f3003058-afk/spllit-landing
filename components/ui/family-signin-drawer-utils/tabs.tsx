'use client';

import * as React from 'react';
import { motion } from 'motion/react';

import { cn } from '@/lib/utils';

/**
 * Animated tabs with a sliding active pill, plus the `useMeasure` hook the
 * drawer animates its height from.
 *
 * This module was imported by the upstream snippet but not shipped with it, so
 * it is written here against the same API. Deliberately not built on
 * `@radix-ui/react-tabs`: two tabs with a `layoutId` pill need no roving
 * tabindex machinery, and the dependency would exist for this file alone.
 */

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
  /** Distinguishes multiple tab groups on one page for layoutId purposes. */
  groupId: string;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabs(): TabsContextValue {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('AnimatedTabs parts must be used inside <AnimatedTabs>');
  return context;
}

/**
 * Observes an element's rendered height.
 *
 * Returns 0 until the first observation, which callers treat as "not measured
 * yet" and fall back to a fixed height for — animating from 0 would collapse
 * the panel on first paint.
 */
export function useMeasure<T extends HTMLElement>(): [
  React.RefObject<T | null>,
  { height: number; width: number },
] {
  const ref = React.useRef<T>(null);
  const [bounds, setBounds] = React.useState({ height: 0, width: 0 });

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const box = entry.contentRect;
      setBounds((previous) =>
        // Sub-pixel jitter from the spring animation would otherwise feed back
        // into the height it is animating towards and never settle.
        Math.abs(previous.height - box.height) < 0.5 &&
        Math.abs(previous.width - box.width) < 0.5
          ? previous
          : { height: box.height, width: box.width },
      );
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, bounds];
}

export function AnimatedTabs({
  defaultValue,
  children,
  className,
}: {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [value, setValue] = React.useState(defaultValue);
  const groupId = React.useId();

  const context = React.useMemo(
    () => ({ value, setValue, groupId }),
    [value, groupId],
  );

  return (
    <TabsContext.Provider value={context}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function AnimatedTabsList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex w-full items-center gap-1 rounded-2xl bg-surface-sunken p-1',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AnimatedTabsTrigger({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { value: active, setValue, groupId } = useTabs();
  const selected = active === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={() => setValue(value)}
      className={cn(
        'relative flex flex-1 items-center justify-center rounded-xl px-3 py-2.5',
        'text-sm font-medium transition-colors duration-snap',
        selected ? 'text-ink' : 'text-ink-muted hover:text-ink',
        className,
      )}
    >
      {selected ? (
        <motion.span
          layoutId={`${groupId}-active-tab`}
          transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
          className="absolute inset-0 rounded-xl bg-surface shadow-soft"
        />
      ) : null}
      <span className="relative flex items-center">{children}</span>
    </button>
  );
}

export function AnimatedTabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { value: active } = useTabs();
  if (active !== value) return null;

  return (
    <motion.div
      role="tabpanel"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
