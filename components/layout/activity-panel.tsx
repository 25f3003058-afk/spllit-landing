'use client';

import Link from 'next/link';
import { Bell, MapPin, Sparkles, Users } from 'lucide-react';

import { cn, formatCountdown, formatRelative } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useEvents, useNearbyPeople, useNotifications } from '@/lib/hooks/queries';
import { useGeolocation } from '@/lib/hooks/use-geolocation';

function PanelSection({
  title,
  icon,
  children,
  href,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  href?: string;
}) {
  return (
    <section className="px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-subtle">
          <span className="text-ink-subtle">{icon}</span>
          {title}
        </h3>
        {href ? (
          <Link href={href} className="text-[11px] font-medium text-ink-subtle hover:text-brand">
            All
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/**
 * Right-hand activity rail. Desktop only in the shell; on tablet it becomes a
 * slide-over driven by the same component (no duplicate implementation).
 */
export function ActivityPanel({ className }: { className?: string }) {
  const { center } = useGeolocation();
  const notifications = useNotifications();
  const nearby = useNearbyPeople(center);
  const events = useEvents({ near: center ?? undefined, limit: 3 }, Boolean(center));

  const recent = notifications.data?.items.slice(0, 4) ?? [];
  const people = nearby.data?.slice(0, 6) ?? [];
  const upcoming = events.data?.items.slice(0, 3) ?? [];

  return (
    <div className={cn('divide-y divide-line', className)}>
      <PanelSection title="Notifications" icon={<Bell className="h-3.5 w-3.5" />} href="/notifications">
        {notifications.isPending ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex gap-2.5">
                <Skeleton className="h-7 w-7 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <p className="text-[12.5px] leading-relaxed text-ink-subtle">
            Nothing new. Join a squad or a ride and updates will land here.
          </p>
        ) : (
          <ul className="space-y-3">
            {recent.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.href ?? '/notifications'}
                  className="group flex gap-2.5 rounded-md p-1 -m-1 transition-colors hover:bg-surface-sunken"
                >
                  <span
                    className={cn(
                      'mt-1 h-1.5 w-1.5 shrink-0 rounded-full',
                      n.readAt ? 'bg-transparent' : 'bg-brand',
                    )}
                  />
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-[12.5px] leading-snug text-ink">{n.title}</p>
                    <p className="mt-0.5 text-[11px] text-ink-subtle">
                      {formatRelative(n.createdAt)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PanelSection>

      <PanelSection title="Nearby" icon={<Users className="h-3.5 w-3.5" />}>
        {!center ? (
          <p className="text-[12.5px] leading-relaxed text-ink-subtle">
            Turn on location to see who&apos;s around.
          </p>
        ) : nearby.isPending ? (
          <div className="flex gap-1.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-8 w-8 rounded-full" />
            ))}
          </div>
        ) : people.length === 0 ? (
          <p className="text-[12.5px] leading-relaxed text-ink-subtle">
            No one from your network is nearby right now.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {people.map((person) => (
              <Link key={person.id} href={`/profile/${person.id}`} title={person.name}>
                <Avatar src={person.profilePhoto} name={person.name} size="sm" online />
              </Link>
            ))}
          </div>
        )}
      </PanelSection>

      <PanelSection title="Upcoming" icon={<Sparkles className="h-3.5 w-3.5" />} href="/events">
        {events.isPending ? (
          <div className="space-y-2.5">
            {Array.from({ length: 2 }, (_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-md" />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <p className="text-[12.5px] leading-relaxed text-ink-subtle">
            No events on the calendar near you.
          </p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/events/${event.id}`}
                  className="block rounded-md p-2 -m-2 transition-colors hover:bg-surface-sunken"
                >
                  <p className="truncate text-[12.5px] font-medium text-ink">{event.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge tone="brand" className="px-1.5 py-0.5 text-[9px]">
                      {formatCountdown(event.startsAt)}
                    </Badge>
                    {event.venue.label ? (
                      <span className="flex min-w-0 items-center gap-1 text-[11px] text-ink-subtle">
                        <MapPin className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate">{event.venue.label}</span>
                      </span>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PanelSection>
    </div>
  );
}
