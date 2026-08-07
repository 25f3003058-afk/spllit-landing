'use client';

import Link from 'next/link';
import { CalendarDays, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonList } from '@/components/ui/skeleton';
import { EventCard } from '@/components/shared/entity-cards';
import { useGeolocation } from '@/lib/hooks/use-geolocation';
import { useEvents } from '@/lib/hooks/queries';

export default function EventsPage() {
  const { center } = useGeolocation();
  const { data, isPending, isError } = useEvents(
    { near: center ?? undefined, limit: 30 },
    Boolean(center),
  );
  const events = data?.items ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-ink">
            Events
          </h1>
          <p className="mt-1 text-[14px] text-ink-muted">
            What&apos;s happening around you, with live attendance.
          </p>
        </div>
        <Link href="/events/new" className="shrink-0">
          <Button size="sm">
            <Plus className="h-3.5 w-3.5" />
            Host
          </Button>
        </Link>
      </header>

      {isPending || !center ? (
        <SkeletonList count={4} />
      ) : isError ? (
        <EmptyState
          tone="error"
          icon={<CalendarDays className="h-5 w-5" />}
          title="Couldn't load events"
        />
      ) : events.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-5 w-5" />}
          title="Nothing scheduled nearby"
          description="Host something and it'll appear on the map for everyone around you."
          action={
            <Link href="/events/new">
              <Button size="sm">Host an event</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
