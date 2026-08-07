'use client';

import { Activity, Map, MessageCircle, Users } from 'lucide-react';

import { cn } from '@/lib/utils';
import { AnimatedBackground } from '@/components/core/animated-background';

export type SquadTab = 'members' | 'map' | 'chat' | 'activity';

const TABS: { value: SquadTab; label: string; Icon: typeof Users }[] = [
  { value: 'members', label: 'Members', Icon: Users },
  { value: 'map', label: 'Map', Icon: Map },
  { value: 'chat', label: 'Chat', Icon: MessageCircle },
  { value: 'activity', label: 'Activity', Icon: Activity },
];

/**
 * Squad tabs, on the sliding-pill background.
 *
 * Labels stay next to the icons rather than going icon-only: four tabs is few
 * enough that the words fit, and "Activity" has no glyph anyone reads reliably.
 */
export function SquadTabs({
  value,
  onChange,
  memberCount,
}: {
  value: SquadTab;
  onChange: (next: SquadTab) => void;
  memberCount: number;
}) {
  return (
    <div
      role="tablist"
      aria-label="Squad sections"
      className="inline-flex w-full gap-1 rounded-xl border border-line bg-surface p-1 shadow-soft"
    >
      <AnimatedBackground
        value={value}
        onValueChange={(next) => onChange(next as SquadTab)}
        className="rounded-lg bg-brand-muted"
        transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.value}
            data-id={tab.value}
            type="button"
            role="tab"
            aria-selected={value === tab.value}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2',
              'text-[13px] font-medium transition-colors duration-100',
              'text-ink-muted data-[checked=true]:text-brand',
            )}
          >
            <tab.Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.value === 'members' ? (
              <span className="rounded-full bg-surface-sunken px-1.5 text-[11px] font-semibold text-ink-muted">
                {memberCount}
              </span>
            ) : null}
          </button>
        ))}
      </AnimatedBackground>
    </div>
  );
}
