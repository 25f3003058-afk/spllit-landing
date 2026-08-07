'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { cn } from '@/lib/utils';
import { ridesService } from '@/lib/services/rides';
import { useAuth } from '@/lib/auth/auth-provider';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import type { RideStatus } from '@/types';

/** Terminal states read as history; everything else is still in play. */
const TONE: Record<RideStatus, 'neutral' | 'brand' | 'accent' | 'danger'> = {
  requested: 'accent',
  accepted: 'brand',
  arriving: 'brand',
  in_progress: 'brand',
  completed: 'neutral',
  cancelled: 'danger',
};

const LABEL: Record<RideStatus, string> = {
  requested: 'Open',
  accepted: 'Matched',
  arriving: 'Arriving',
  in_progress: 'On the road',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function HostTrips() {
  const { profile } = useAuth();
  const { data, isPending } = useQuery({
    queryKey: ['host', 'trips'],
    queryFn: () => ridesService.mine(),
  });

  if (isPending) {
    return (
      <div className="mx-auto max-w-2xl space-y-2">
        <Skeleton className="h-[74px] w-full rounded-2xl" />
        <Skeleton className="h-[74px] w-full rounded-2xl" />
      </div>
    );
  }

  // `mine` returns trips hosted *and* joined; this surface is the host's own.
  const hosted = (data ?? []).filter((ride) => ride.userId === profile?.id);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="font-display text-[20px] font-semibold tracking-[-0.02em] text-ink">
        My trips
      </h1>

      {hosted.length === 0 ? (
        <EmptyState
          title="Nothing posted yet"
          description="Trips you offer will show here, with who has joined each one."
        />
      ) : (
        <ul className="space-y-2">
          {hosted.map((ride) => (
            <li key={ride.id}>
              <Link
                href={`/rides/${ride.id}`}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5',
                  'transition-colors duration-snap hover:border-line-strong',
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-medium text-ink">
                      {ride.origin} → {ride.destination}
                    </span>
                    <Badge tone={TONE[ride.status]}>{LABEL[ride.status]}</Badge>
                  </span>
                  <span className="block truncate text-[12.5px] text-ink-muted">
                    {new Date(ride.departureTime).toLocaleString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}{' '}
                    · {ride.seatsTaken}/{ride.seats} seats taken
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
