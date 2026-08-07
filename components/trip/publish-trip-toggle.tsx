'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Radio } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ApiError } from '@/lib/api/client';
import { tripsService } from '@/lib/services/trips';
import type { PickedPlace } from '@/components/shared/place-picker';
import type { LngLat } from '@/types';

/**
 * Makes the rider findable.
 *
 * Searching is one-directional and invisible: it runs here and leaves nothing
 * a host could ever match against. Publishing writes a TripRequest, which is
 * what a host's corridor query reads — so this toggle is the difference
 * between looking for a ride and being offered one.
 *
 * Opt-in on purpose. Publishing puts a route and a departure time where other
 * users can see them, and that should be a decision rather than a side effect
 * of pressing Search.
 */
export function PublishTripToggle({
  pickup,
  destination,
  originPoint,
  departAt,
}: {
  pickup: PickedPlace | null;
  destination: PickedPlace | null;
  originPoint: LngLat | null;
  departAt: string;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: published } = useQuery({
    queryKey: ['trips', 'request', 'mine'],
    queryFn: () => tripsService.mine(),
  });

  const publish = useMutation({
    mutationFn: () => {
      if (!destination || !originPoint) throw new Error('A pickup and destination are required.');
      return tripsService.publish({
        // The typed pickup wins; otherwise it is wherever the device says the
        // rider is, which is what the map is already centred on.
        originLabel: pickup?.label ?? 'Current location',
        originLat: originPoint[1],
        originLng: originPoint[0],
        destLabel: destination.label,
        destLat: destination.lat,
        destLng: destination.lng,
        departAt,
        windowMins: 90,
      });
    },
    onSuccess: (request) => {
      setError(null);
      queryClient.setQueryData(['trips', 'request', 'mine'], request);
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not publish your trip.'),
  });

  const withdraw = useMutation({
    mutationFn: (id: string) => tripsService.withdraw(id),
    onSuccess: () => {
      setError(null);
      queryClient.setQueryData(['trips', 'request', 'mine'], null);
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not withdraw your trip.'),
  });

  const busy = publish.isPending || withdraw.isPending;

  return (
    <div className="rounded-xl border border-line bg-surface-sunken p-3">
      <div className="flex items-start gap-2.5">
        <Radio
          className={cn(
            'mt-0.5 h-4 w-4 shrink-0',
            published ? 'text-brand' : 'text-ink-subtle',
          )}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-ink">
            {published ? "Hosts can see you're going" : 'Let hosts find you'}
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-ink-muted">
            {published
              ? 'Drivers heading your way can offer you a seat.'
              : 'Publish this trip so drivers on your route can invite you.'}
          </p>
        </div>
      </div>

      <button
        type="button"
        disabled={busy || (!published && !destination)}
        onClick={() => (published ? withdraw.mutate(published.id) : publish.mutate())}
        className={cn(
          'mt-3 h-9 w-full rounded-lg text-[13px] font-medium transition-colors duration-snap',
          published
            ? 'border border-line-strong text-ink hover:bg-surface'
            : 'bg-brand text-brand-fg hover:bg-brand-hover',
          'disabled:pointer-events-none disabled:opacity-50',
        )}
      >
        {busy ? 'Saving…' : published ? 'Stop showing me' : 'Publish my trip'}
      </button>

      {published ? (
        <Link
          href="/rides/invites"
          className="mt-2 block text-center text-[12px] font-medium text-brand hover:underline"
        >
          See invites
        </Link>
      ) : null}

      {error ? (
        <p role="alert" className="mt-2 text-[12px] leading-relaxed text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
