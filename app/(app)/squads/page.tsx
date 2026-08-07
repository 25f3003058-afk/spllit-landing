'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Plus, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonList } from '@/components/ui/skeleton';
import { SquadCard } from '@/components/shared/entity-cards';
import { useGeolocation } from '@/lib/hooks/use-geolocation';
import { useMySquads, useSquads } from '@/lib/hooks/queries';

type Mode = 'nearby' | 'mine';

export default function SquadsPage() {
  const [mode, setMode] = useState<Mode>('nearby');
  const { center } = useGeolocation();

  const nearby = useSquads({ near: center ?? undefined, limit: 30 }, Boolean(center) && mode === 'nearby');
  const mine = useMySquads();

  const isPending = mode === 'nearby' ? nearby.isPending || !center : mine.isPending;
  const squads = mode === 'nearby' ? (nearby.data?.items ?? []) : (mine.data ?? []);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-ink">
            Squads
          </h1>
          <p className="mt-1 text-[14px] text-ink-muted">
            A group, a meeting point, and everyone&apos;s ETA in one place.
          </p>
        </div>
        <Link href="/squads/new" className="shrink-0">
          <Button size="sm">
            <Plus className="h-3.5 w-3.5" />
            New squad
          </Button>
        </Link>
      </header>

      <Segmented
        value={mode}
        onChange={setMode}
        items={[
          { value: 'nearby', label: 'Discover' },
          { value: 'mine', label: 'Your squads' },
        ]}
      />

      {isPending ? (
        <SkeletonList count={4} />
      ) : squads.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title={mode === 'mine' ? "You're not in a squad yet" : 'No squads nearby'}
          description={
            mode === 'mine'
              ? 'Join one from Discover, or start your own and invite people.'
              : 'Nothing forming around you right now. Start a squad and drop a meeting point.'
          }
          action={
            <Link href="/squads/new">
              <Button size="sm">Start a squad</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {squads.map((squad) => (
            <SquadCard key={squad.id} squad={squad} />
          ))}
        </div>
      )}
    </div>
  );
}
