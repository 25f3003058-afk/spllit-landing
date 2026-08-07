'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Users } from 'lucide-react';

import { formatCountdown, formatCurrency, formatTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { MapCanvas } from '@/components/map/map-canvas';
import { useAttendEvent, useEvent } from '@/lib/hooks/queries';
import type { MapEntity } from '@/lib/map/types';

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: event, isPending, isError } = useEvent(id);
  const attend = useAttendEvent(id);

  if (isPending) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-[240px] w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <EmptyState
        tone="error"
        title="Event not found"
        description="It may have been cancelled or made private."
        action={
          <Link href="/events">
            <Button size="sm" variant="secondary">
              Back to events
            </Button>
          </Link>
        }
      />
    );
  }

  const entities: MapEntity[] = [
    {
      id: `venue:${event.id}`,
      layer: 'events',
      position: [event.venue.lng, event.venue.lat],
      title: event.venue.label ?? event.title,
      subtitle: `${event.attendeeCount} going`,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/events"
          aria-label="Back to events"
          className="rounded-md p-2 text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-[22px] font-semibold tracking-[-0.025em] text-ink">
            {event.title}
          </h1>
          <p className="truncate text-[13px] text-ink-muted">
            {formatTime(event.startsAt)} · {formatCountdown(event.startsAt)}
          </p>
        </div>
        {event.ticketType === 'paid' && event.price ? (
          <Badge>{formatCurrency(event.price)}</Badge>
        ) : (
          <Badge tone="brand">Free</Badge>
        )}
      </div>

      <div className="h-[min(34dvh,240px)] overflow-hidden rounded-lg border border-line sm:h-[240px]">
        <MapCanvas
          mode="focused-event"
          layers={['events']}
          entities={entities}
          center={[event.venue.lng, event.venue.lat]}
          showSelf={false}
        />
      </div>

      {event.venue.label || event.venue.address ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-line bg-surface px-4 py-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-subtle" />
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-medium text-ink">
              {event.venue.label ?? 'Venue'}
            </p>
            {event.venue.address ? (
              <p className="truncate text-[12.5px] text-ink-muted">{event.venue.address}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {event.description ? (
        <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-ink-muted">
          {event.description}
        </p>
      ) : null}

      <div className="flex items-center justify-between rounded-lg border border-line bg-surface px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Users className="h-4 w-4 text-ink-subtle" />
          <span className="text-[13.5px] text-ink">
            {event.attendeeCount} going
            {event.capacity ? ` of ${event.capacity}` : ''}
          </span>
        </div>
        {event.host ? (
          <Link
            href={`/profile/${event.hostId}`}
            className="flex items-center gap-2 text-[12.5px] text-ink-muted hover:text-ink"
          >
            <Avatar src={event.host.profilePhoto} name={event.host.name} size="xs" />
            {event.host.name}
          </Link>
        ) : null}
      </div>

      <div className="sticky bottom-24 lg:bottom-4">
        <Button
          size="lg"
          className="w-full"
          variant={event.viewerAttending ? 'outline' : 'primary'}
          loading={attend.isPending}
          onClick={() => attend.mutate(event.viewerAttending ? 'cancelled' : 'going')}
        >
          {event.viewerAttending ? "You're going — tap to cancel" : "I'm going"}
        </Button>
      </div>
    </div>
  );
}
