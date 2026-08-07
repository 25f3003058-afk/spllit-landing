'use client';

import { motion } from 'motion/react';

import { cn } from '@/lib/utils';

export interface TabItem<T extends string> {
  value: T;
  label: string;
  count?: number;
}

/**
 * Underline tabs with a shared layout indicator. Used for squad detail,
 * search results and community channels — one implementation, not three.
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
  layoutId = 'tab-indicator',
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  layoutId?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn('no-scrollbar flex gap-1 overflow-x-auto border-b border-line', className)}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              'relative shrink-0 px-4 py-3 text-[13px] font-medium transition-colors duration-snap',
              active ? 'text-ink' : 'text-ink-subtle hover:text-ink-muted',
            )}
          >
            <span className="flex items-center gap-2">
              {item.label}
              {item.count !== undefined ? (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                    active ? 'bg-brand-muted text-brand' : 'bg-surface-sunken text-ink-subtle',
                  )}
                >
                  {item.count}
                </span>
              ) : null}
            </span>
            {active ? (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Pill-style segmented control — for map layer filters and list modes. */
export function Segmented<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('inline-flex gap-1 rounded-lg bg-surface-sunken p-1', className)}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            onClick={() => onChange(item.value)}
            className={cn(
              'relative rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-snap',
              active ? 'text-ink' : 'text-ink-subtle hover:text-ink-muted',
            )}
          >
            {active ? (
              <motion.span
                layoutId="segmented-bg"
                className="absolute inset-0 rounded-md bg-surface shadow-soft"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            ) : null}
            <span className="relative">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
