'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Car, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonList } from '@/components/ui/skeleton';
import { RideCard } from '@/components/shared/entity-cards';
import { useGeolocation } from '@/lib/hooks/use-geolocation';
import { useMyRides, useRides } from '@/lib/hooks/queries';

type Mode = 'nearby' | 'mine';

export default function RidesPage() {
  const [mode, setMode] = useState<Mode>('nearby');
  const { center } = useGeolocation();

  const nearby = useRides({ near: center ?? undefined, limit: 30 }, Boolean(center) && mode === 'nearby');
  const mine = useMyRides();

  const isPending = mode === 'nearby' ? nearby.isPending || !center : mine.isPending;
  const isError = mode === 'nearby' ? nearby.isError : mine.isError;
  const rides = mode === 'nearby' ? (nearby.data?.items ?? []) : (mine.data ?? []);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-ink">
            Rides
          </h1>
          <p className="mt-1 text-[14px] text-ink-muted">
            Split a cab, bike or auto with someone going your way.
          </p>
        </div>
        <Link href="/rides/new" className="shrink-0">
          <Button size="sm">
            <Plus className="h-3.5 w-3.5" />
            Offer a ride
          </Button>
        </Link>
      </header>

      <Segmented
        value={mode}
        onChange={setMode}
        items={[
          { value: 'nearby', label: 'Near you' },
          { value: 'mine', label: 'Your rides' },
        ]}
      />

      {isPending ? (
        <SkeletonList count={4} />
      ) : isError ? (
        <EmptyState
          tone="error"
          icon={<Car className="h-5 w-5" />}
          title="Couldn't load rides"
          description="Something went wrong fetching rides. We'll keep retrying."
        />
      ) : rides.length === 0 ? (
        <EmptyState
          icon={<Car className="h-5 w-5" />}
          title={mode === 'mine' ? "You haven't posted or joined a ride" : 'No rides near you'}
          description={
            mode === 'mine'
              ? 'Rides you host or join will live here, with live tracking once they start.'
              : 'Nobody has posted a ride around you yet. Post yours and split the fare.'
          }
          action={
            <Link href="/rides/new">
              <Button size="sm">Offer a ride</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {rides.map((ride) => (
            <RideCard key={ride.id} ride={ride} />
          ))}
        </div>
      )}
    </div>
  );
}
