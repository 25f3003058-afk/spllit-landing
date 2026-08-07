'use client';

import { use, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, MapPin, Paperclip, Users } from 'lucide-react';

import { formatCountdown } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { useSquadPresence } from '@/lib/hooks/use-squad-presence';
import { squadMembersService } from '@/lib/services/squads';
import { SquadMembersBoard } from '@/components/squads/squad-members-board';
import { SquadJoinCode } from '@/components/squads/squad-join-code';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton, SkeletonMap } from '@/components/ui/skeleton';
import { MapCanvas } from '@/components/map/map-canvas';
import { ChatThreadView } from '@/components/chat/chat-thread';
import { useJoinSquad, useSquad } from '@/lib/hooks/queries';
import { useAuth } from '@/lib/auth/auth-provider';
import { useLivePositions } from '@/lib/live/use-live';
import { rooms } from '@/lib/live/socket';
import type { MapEntity } from '@/lib/map/types';

type Tab = 'members' | 'map' | 'chat' | 'files' | 'activity';

export default function SquadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile } = useAuth();
  const { data: squad, isPending, isError } = useSquad(id);
  const join = useJoinSquad(id);
  const [tab, setTab] = useState<Tab>('members');

  // One room for the whole squad; the server fans member positions into it.
  const livePositions = useLivePositions(useMemo(() => [rooms.squad(id)], [id]));

  /**
   * Both of these sit above the loading and error returns because hooks may
   * not be called conditionally — `enabled` is what actually gates them, not
   * their position in the function.
   *
   * Position reporting runs only for a member of an active squad, and only
   * while this page is open: closing it stops the broadcast, which is what
   * someone would expect from "I am on the squad screen".
   */
  const canShare = Boolean(
    squad?.viewerRole && squad.status === 'active' && squad.can?.shareLocation,
  );
  const presence = useSquadPresence(id, { enabled: canShare });

  const progress = useQuery({
    queryKey: ['squad', id, 'progress'],
    queryFn: () => squadMembersService.progress(id),
    enabled: Boolean(squad?.viewerRole),
    // Each poll costs one walking-Directions call per moving member, so this
    // is deliberately slower than the socket position stream.
    refetchInterval: 20_000,
  });

  if (isPending) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !squad) {
    return (
      <EmptyState
        tone="error"
        title="Squad not found"
        description="It may be private, or it may have been disbanded."
        action={
          <Link href="/squads">
            <Button size="sm" variant="secondary">
              Back to squads
            </Button>
          </Link>
        }
      />
    );
  }

  const isLeader = squad.viewerRole === 'leader' || squad.leaderId === profile?.id;
  const isMember = Boolean(squad.viewerRole);

  const entities: MapEntity[] = [];
  if (squad.meetingPoint) {
    entities.push({
      id: `meeting:${squad.id}`,
      layer: 'squads',
      position: [squad.meetingPoint.lng, squad.meetingPoint.lat],
      title: squad.meetingPoint.label ?? 'Meeting point',
      subtitle: squad.meetingAt ? formatCountdown(squad.meetingAt) : null,
      marker: 'meeting',
      live: true,
    });
  }
  if (squad.destination) {
    entities.push({
      id: `destination:${squad.id}`,
      layer: 'squads',
      position: [squad.destination.lng, squad.destination.lat],
      title: squad.destination.label ?? 'Destination',
      marker: 'destination',
    });
  }

  /**
   * Members carry their role into the marker so the map reads without a
   * legend: the leader is crowned, guests are grey. The viewer is skipped —
   * SplitMap already draws them as the blue self puck, and two markers on one
   * person is just clutter.
   */
  for (const entry of progress.data?.items ?? []) {
    if (entry.lat === null || entry.lng === null) continue;
    if (entry.user.id === profile?.id) continue;
    entities.push({
      id: `member:${entry.user.id}`,
      layer: 'friends',
      position: [entry.lng, entry.lat],
      title: entry.user.name,
      subtitle: entry.status === 'arrived' ? 'Arrived' : null,
      marker:
        entry.role === 'leader' ? 'leader' : entry.role === 'guest' ? 'guest' : 'member',
      live: entry.status === 'travelling',
      imageUrl: entry.user.profilePhoto,
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/squads"
          aria-label="Back to squads"
          className="rounded-md p-2 text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-[22px] font-semibold tracking-[-0.025em] text-ink">
            {squad.name}
          </h1>
          <p className="truncate text-[13px] text-ink-muted">
            {squad.memberCount} member{squad.memberCount === 1 ? '' : 's'}
            {squad.college ? ` · ${squad.college}` : ''}
          </p>
        </div>
        {!isMember ? (
          <Button size="sm" loading={join.isPending} onClick={() => join.mutate()}>
            Join
          </Button>
        ) : (
          <Badge tone="brand">{isLeader ? 'Leader' : 'Member'}</Badge>
        )}
      </div>

      {squad.meetingPoint ? (
        <div className="flex items-center gap-2.5 rounded-lg bg-accent-muted px-4 py-3">
          <MapPin className="h-4 w-4 shrink-0 text-accent" />
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-accent">
            {squad.meetingPoint.label ?? 'Meeting point set'}
          </span>
          {squad.meetingAt ? (
            <span className="shrink-0 text-[13px] text-accent">
              {formatCountdown(squad.meetingAt)}
            </span>
          ) : null}
        </div>
      ) : isLeader ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-line px-4 py-3">
          <span className="text-[13px] text-ink-muted">No meeting point yet.</span>
          <Button size="sm" variant="secondary" onClick={() => setTab('map')}>
            Set one
          </Button>
        </div>
      ) : null}

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'members', label: 'Members', count: squad.memberCount },
          { value: 'map', label: 'Map' },
          { value: 'chat', label: 'Chat' },
          { value: 'files', label: 'Files' },
          { value: 'activity', label: 'Activity' },
        ]}
      />

      {tab === 'members' ? (
        isMember && squad.can ? (
          <div className="space-y-4">
            {/* Members only: a code on a page anyone can open is not a code. */}
            {squad.joinCode ? <SquadJoinCode code={squad.joinCode} /> : null}
            <SquadMembersBoard squadId={squad.id} can={squad.can} viewerId={profile?.id} />
          </div>
        ) : (
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title="Members are private"
            description="Join the squad to see who is coming and how far away they are."
          />
        )
      ) : null}

      {/* Location banner. Sharing is what the whole live map depends on, so a
          denied permission is stated plainly rather than showing an empty map. */}
      {isMember && presence.error ? (
        <p className="rounded-lg bg-warning/10 px-4 py-3 text-[13px] leading-relaxed text-ink">
          {presence.error}
        </p>
      ) : isMember && presence.arrived ? (
        <p className="rounded-lg bg-brand-muted px-4 py-3 text-[13px] font-medium text-brand">
          You&apos;re at the meeting point.
        </p>
      ) : null}

      {tab === 'map' ? (
        <div className="h-[min(55dvh,420px)] overflow-hidden rounded-lg border border-line sm:h-[420px]">
          {squad.meetingPoint || livePositions.size > 0 ? (
            <MapCanvas
              mode="focused-squad"
              layers={['squads', 'friends']}
              entities={entities}
              livePositions={livePositions}
              center={
                squad.meetingPoint
                  ? [squad.meetingPoint.lng, squad.meetingPoint.lat]
                  : null
              }
            />
          ) : (
            <SkeletonMap />
          )}
        </div>
      ) : null}

      {tab === 'chat' ? <ChatThreadView contextType="squad" contextId={squad.id} /> : null}

      {tab === 'files' ? (
        <EmptyState
          icon={<Paperclip className="h-5 w-5" />}
          title="No files shared yet"
          description="Images and files sent in squad chat collect here."
        />
      ) : null}

      {tab === 'activity' ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="No activity yet"
          description="Joins, meeting-point changes and ride links will appear here."
        />
      ) : null}
    </div>
  );
}
