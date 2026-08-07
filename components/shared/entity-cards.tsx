'use client';

import Link from 'next/link';
import { CalendarDays, Car, MapPin, Users } from 'lucide-react';

import { cn, formatCountdown, formatCurrency, formatTime } from '@/lib/utils';
import { Avatar, AvatarStack } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Community, Ride, Squad, SpllitEvent } from '@/types';

/**
 * The canonical card for each entity type. Lists, rails, search results and map
 * preview sheets all render these — never a bespoke copy of the markup.
 */

const shell =
  'block rounded-lg border border-line bg-surface p-4 transition-all duration-snap hover:border-line-strong hover:shadow-raised';

export function RideCard({ ride, className }: { ride: Ride; className?: string }) {
  const seatsLeft = Math.max(0, ride.seats - ride.seatsTaken);
  const live = ride.status === 'arriving' || ride.status === 'in_progress';

  return (
    <Link href={`/rides/${ride.id}`} className={cn(shell, className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand">
            <Car className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{ride.destination}</p>
            <p className="truncate text-[12.5px] text-ink-muted">from {ride.origin}</p>
          </div>
        </div>
        {live ? <Badge tone="live">Live</Badge> : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[12.5px] text-ink-muted">
          <Avatar src={ride.host?.profilePhoto} name={ride.host?.name} size="xs" />
          <span className="truncate">{ride.host?.name ?? 'Host'}</span>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-[12.5px]">
          <span className="text-ink-muted">
            {seatsLeft} seat{seatsLeft === 1 ? '' : 's'}
          </span>
          {ride.fare !== null ? (
            <span className="font-semibold text-ink">{formatCurrency(ride.fare)}</span>
          ) : null}
        </div>
      </div>

      <div className="mt-3 border-t border-line pt-3 text-[12px] text-ink-subtle">
        {formatTime(ride.departureTime)} · {formatCountdown(ride.departureTime)}
      </div>
    </Link>
  );
}

export function SquadCard({ squad, className }: { squad: Squad; className?: string }) {
  return (
    <Link href={`/squads/${squad.id}`} className={cn(shell, className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-muted text-accent">
            <Users className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{squad.name}</p>
            <p className="truncate text-[12.5px] text-ink-muted">
              {squad.memberCount} member{squad.memberCount === 1 ? '' : 's'}
              {squad.college ? ` · ${squad.college}` : ''}
            </p>
          </div>
        </div>
        {squad.isActive ? <Badge tone="live">Active</Badge> : null}
      </div>

      {squad.meetingPoint ? (
        <div className="mt-4 flex items-center gap-1.5 text-[12.5px] text-ink-muted">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {squad.meetingPoint.label ?? 'Meeting point set'}
            {squad.meetingAt ? ` · ${formatCountdown(squad.meetingAt)}` : ''}
          </span>
        </div>
      ) : (
        <p className="mt-4 text-[12.5px] text-ink-subtle">No meeting point yet.</p>
      )}

      {squad.members?.length ? (
        <div className="mt-3 border-t border-line pt-3">
          <AvatarStack users={squad.members.map((m) => m.user)} max={5} size="xs" />
        </div>
      ) : null}
    </Link>
  );
}

export function EventCard({
  event,
  className,
}: {
  event: SpllitEvent;
  className?: string;
}) {
  return (
    <Link href={`/events/${event.id}`} className={cn(shell, className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{event.title}</p>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12.5px] text-ink-muted">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            {formatTime(event.startsAt)}
            {event.venue.label ? ` · ${event.venue.label}` : ''}
          </p>
        </div>
        <div className="shrink-0 rounded-md bg-warning/12 px-2 py-1.5 text-center">
          <p className="font-display text-[13px] font-bold leading-none text-warning">
            {formatCountdown(event.startsAt).replace('in ', '')}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[12.5px]">
        <span className="text-ink-muted">{event.attendeeCount} going</span>
        {event.ticketType === 'paid' && event.price ? (
          <span className="font-semibold text-ink">{formatCurrency(event.price)}</span>
        ) : (
          <Badge tone="brand">Free</Badge>
        )}
      </div>
    </Link>
  );
}

export function CommunityCard({
  community,
  className,
}: {
  community: Community;
  className?: string;
}) {
  return (
    <Link href={`/communities/${community.id}`} className={cn(shell, className)}>
      <div className="flex items-start gap-3">
        <Avatar src={community.imageUrl} name={community.name} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{community.name}</p>
          <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-ink-muted">
            {community.description ?? `${community.memberCount} members`}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-[12px] text-ink-subtle">
        <span>{community.memberCount} members</span>
        {community.college ? <span>· {community.college}</span> : null}
      </div>
    </Link>
  );
}
