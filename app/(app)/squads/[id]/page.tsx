'use client';

import { use, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, MapPin, Users } from 'lucide-react';

import { formatCountdown } from '@/lib/utils';
import { purposeIcon, purposeLabel } from '@/lib/squad-purpose';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SquadTabs, type SquadTab } from '@/components/squads/squad-tabs';
import { useSquadPresence } from '@/lib/hooks/use-squad-presence';
import { squadMembersService } from '@/lib/services/squads';
import { SquadMembersBoard } from '@/components/squads/squad-members-board';
import { SquadJoinCode } from '@/components/squads/squad-join-code';
import { SquadJourneyPanel } from '@/components/squads/squad-journey-panel';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton, SkeletonMap } from '@/components/ui/skeleton';
import { MapCanvas } from '@/components/map/map-canvas';
import { ChatDialog } from '@/components/chat/chat-dialog';
import { useEndSquad, useJoinSquad, useLeaveSquad, useSquad } from '@/lib/hooks/queries';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-provider';
import { useLivePositions } from '@/lib/live/use-live';
import { rooms } from '@/lib/live/socket';
import type { MapEntity } from '@/lib/map/types';

export default function SquadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile } = useAuth();
  const { data: squad, isPending, isError } = useSquad(id);
  const join = useJoinSquad(id);
  const leave = useLeaveSquad(id);
  const endSquad = useEndSquad(id);
  const router = useRouter();
  const [tab, setTab] = useState<SquadTab>('members');
  /** Two-step, because leaving can also transfer leadership. */
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  /** Set when the API rejects a join because the user is committed elsewhere. */
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  /** Which terminal transition the leader is confirming, if any. */
  const [endAction, setEndAction] = useState<'completed' | 'cancelled' | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

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

  /**
   * The viewer's own row from the progress poll. `presence` is the live
   * client-side distance and updates every tick; this carries the server's
   * walking ETA, which needs a Directions call and so refreshes far slower.
   */
  const viewerProgress = progress.data?.items.find((entry) => entry.user.id === profile?.id);

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
          {/* Destination headlines here too, so the page matches the card and
              the map marker someone tapped to reach it. */}
          {/* The destination is the headline and is set noticeably larger than
              the supporting line — it is the one thing someone opening this
              page needs to confirm before anything else. */}
          <h1 className="truncate font-display text-[26px] font-bold leading-tight tracking-[-0.03em] text-ink sm:text-[30px]">
            {squad.destination?.label?.split(',')[0] ?? squad.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-muted">
            {squad.destination ? <span className="truncate">{squad.name}</span> : null}
            <span aria-hidden className="text-ink-subtle">·</span>
            <span className="inline-flex items-center gap-1 font-medium text-ink">
              <Users className="h-3.5 w-3.5" />
              {squad.memberCount}
              {squad.memberLimit ? `/${squad.memberLimit}` : ''}
            </span>
            <span aria-hidden className="text-ink-subtle">·</span>
            {/* Emoji is decorative; the label carries the meaning. */}
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-muted px-2 py-0.5 text-[12px] font-medium text-brand">
              <span aria-hidden>{purposeIcon(squad.type)}</span>
              {purposeLabel(squad.type)}
            </span>
          </div>
        </div>
        {isMember ? (
          <Badge tone="brand">{isLeader ? 'Leader' : 'Member'}</Badge>
        ) : squad.viewerStatus === 'pending' || join.data?.viewerStatus === 'pending' ? (
          /* Admission is the leader's call, so this is a waiting state, not a
             membership one — offering "Join" again here would suggest the tap
             failed and queue nothing. */
          <Badge tone="neutral">Request sent</Badge>
        ) : (
          <Button
            size="sm"
            loading={join.isPending}
            onClick={() =>
              join.mutate(undefined, {
                onError: (err) => {
                  // 409 means they are committed elsewhere — an explainable
                  // situation with an action, not a failure to report.
                  if (err instanceof ApiError && err.code === 'already-in-squad') {
                    setBlockedReason(err.message);
                  }
                },
              })
            }
          >
            Ask to join
          </Button>
        )}
      </div>

      {/* Members get the journey view; everyone else gets the summary strip,
          because distance and navigation only mean anything once you're in. */}
      {isMember && (squad.meetingPoint || squad.destination) ? (
        <>
          <SquadJourneyPanel
            squad={squad}
            distanceMetres={presence.distanceMetres ?? viewerProgress?.distanceMetres ?? null}
            etaSeconds={viewerProgress?.etaSeconds ?? null}
            arrived={presence.arrived || viewerProgress?.status === 'arrived'}
          />
          {squad.meetingAt ? (
            <div className="flex items-center gap-2.5 rounded-lg bg-accent-muted px-4 py-3">
              <Clock className="h-4 w-4 shrink-0 text-accent" />
              <span className="min-w-0 flex-1 text-[13px] font-medium text-accent">
                Leaving {formatCountdown(squad.meetingAt)}
              </span>
            </div>
          ) : null}
        </>
      ) : squad.meetingPoint ? (
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

      {/* Chat is not a tab any more — it opens as a dialog, because a
          conversation inside a scrolling page loses its composer as you type. */}
      <SquadTabs
        value={tab}
        onChange={(next) => {
          if (next === 'chat') {
            setChatOpen(true);
            return;
          }
          setTab(next);
        }}
        memberCount={squad.memberCount}
      />

      {tab === 'members' ? (
        isMember && squad.can ? (
          <div className="space-y-4">
            {/* Members only: a code on a page anyone can open is not a code. */}
            {squad.joinCode ? <SquadJoinCode code={squad.joinCode} /> : null}
            <SquadMembersBoard squadId={squad.id} can={squad.can} viewerId={profile?.id} />

            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
              {/* The leader's way out. Without this the one-squad-at-a-time
                  rule is a trap: they can neither start another nor join one. */}
              {isLeader && squad.status === 'active' ? (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setEndAction('completed')}
                  >
                    Mark as done
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setEndAction('cancelled')}>
                    Cancel squad
                  </Button>
                </>
              ) : null}

              <button
                type="button"
                onClick={() => setLeaveConfirm(true)}
                className="ml-auto text-[13px] font-medium text-danger transition-opacity hover:opacity-80"
              >
                Leave squad
              </button>
            </div>
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
          denied permission is stated plainly rather than showing an empty map.
          The arrived case is not repeated here — the journey panel above
          already says it, next to the distance it replaces. */}
      {isMember && presence.error ? (
        <p className="rounded-lg bg-warning/10 px-4 py-3 text-[13px] leading-relaxed text-ink">
          {presence.error}
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

      {tab === 'activity' ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="No activity yet"
          description="Joins, meeting-point changes and ride links will appear here."
        />
      ) : null}

      <ChatDialog
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        contextType="squad"
        contextId={squad.id}
        title={squad.destination?.label?.split(',')[0] ?? squad.name}
        subtitle={`${squad.memberCount} member${squad.memberCount === 1 ? '' : 's'}`}
      />

      {/* Ending is terminal and releases every member, so it is confirmed with
          the consequences named rather than fired from a bare button. */}
      <ConfirmDialog
        open={endAction !== null}
        onClose={() => setEndAction(null)}
        onConfirm={() =>
          endAction &&
          endSquad.mutate(endAction, { onSuccess: () => router.replace('/squads') })
        }
        eyebrow={endAction === 'cancelled' ? 'Cancel squad' : 'Mark as done'}
        title={squad.destination?.label?.split(',')[0] ?? squad.name}
        description={
          endAction === 'cancelled'
            ? 'Everyone is told the trip is off and released to join another squad. This cannot be undone.'
            : 'The squad closes and everyone is released to join another. This cannot be undone.'
        }
        details={[
          {
            label: `${squad.memberCount} member${squad.memberCount === 1 ? '' : 's'} affected`,
            items: [
              'Live location sharing stops',
              'The group chat closes',
              'Everyone becomes free to join or start another squad',
            ],
          },
        ]}
        confirmLabel={endAction === 'cancelled' ? 'Cancel it' : 'Mark as done'}
        confirmTone={endAction === 'cancelled' ? 'danger' : 'primary'}
        cancelLabel="Keep it running"
        loading={endSquad.isPending}
        error={
          endSquad.isError
            ? endSquad.error instanceof Error
              ? endSquad.error.message
              : "Couldn't update the squad."
            : null
        }
      />

      {/* One squad at a time. Explained rather than reported: the person has a
          clear next step, and it is not "try again". */}
      <ConfirmDialog
        open={Boolean(blockedReason)}
        onClose={() => setBlockedReason(null)}
        onConfirm={() => {
          setBlockedReason(null);
          router.push('/squads');
        }}
        eyebrow="Already in a squad"
        title="You can only be in one squad at a time"
        description={blockedReason ?? ''}
        details={[
          {
            label: 'Why',
            items: [
              'You can only physically travel with one group at a time',
              'Leaders are counting on everyone who joined to actually arrive',
            ],
          },
        ]}
        confirmLabel="Go to my squad"
        cancelLabel="Stay here"
      />

      {/* Leaving is not undoable — rejoining a private squad needs the leader,
          and a leader who leaves hands the squad to someone else. */}
      <ConfirmDialog
        open={leaveConfirm}
        onClose={() => setLeaveConfirm(false)}
        onConfirm={() =>
          leave.mutate(undefined, { onSuccess: () => router.replace('/squads') })
        }
        eyebrow="Leave squad"
        title={squad.destination?.label?.split(',')[0] ?? squad.name}
        description={
          isLeader
            ? 'You lead this squad. Leaving hands it to another member.'
            : 'You will stop sharing your location and lose access to the squad chat.'
        }
        details={[
          {
            label: 'You will lose',
            items: [
              'Squad chat and files',
              'Live location and everyone’s ETA',
              ...(squad.meetingPoint
                ? [`Directions to ${squad.meetingPoint.label?.split(',')[0] ?? 'the meeting point'}`]
                : []),
            ],
          },
        ]}
        secondaryDetails={
          isLeader
            ? [
                {
                  label: 'Handover',
                  items: [
                    'The longest-standing member becomes leader',
                    'They can move the meeting point and admit members',
                  ],
                },
              ]
            : undefined
        }
        confirmLabel="Leave squad"
        confirmTone="danger"
        loading={leave.isPending}
        error={
          leave.isError
            ? leave.error instanceof Error
              ? leave.error.message
              : "Couldn't leave the squad."
            : null
        }
      />
    </div>
  );
}
