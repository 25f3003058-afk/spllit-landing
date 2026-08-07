'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BatteryLow,
  Check,
  Crown,
  MoreHorizontal,
  Shield,
  UserMinus,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { ApiError } from '@/lib/api/client';
import { squadMembersService } from '@/lib/services/squads';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  SquadCapabilities,
  SquadProgressEntry,
  SquadRole,
} from '@/types';

/**
 * Who is where, and how long until they arrive.
 *
 * This is the leader's answer to "do we wait or do we go", so the ETA and the
 * arrival state lead. Everything else — battery, role, controls — is secondary
 * and sits behind it.
 */

function formatEta(entry: SquadProgressEntry): string {
  if (entry.status === 'arrived') return 'Arrived';
  if (entry.etaSeconds === null) {
    return entry.distanceMetres === null ? 'Not sharing' : formatDistance(entry.distanceMetres);
  }
  const minutes = Math.round(entry.etaSeconds / 60);
  return minutes < 1 ? 'Under a minute' : `${minutes} min`;
}

function formatDistance(metres: number): string {
  return metres < 950 ? `${Math.round(metres / 10) * 10} m` : `${(metres / 1000).toFixed(1)} km`;
}

const ROLE_BADGE: Partial<Record<SquadRole, { label: string; Icon: typeof Crown }>> = {
  leader: { label: 'Leader', Icon: Crown },
  'co-leader': { label: 'Co-leader', Icon: Shield },
};

export function SquadMembersBoard({
  squadId,
  can,
  viewerId,
}: {
  squadId: string;
  can: SquadCapabilities;
  viewerId: string | undefined;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const progress = useQuery({
    queryKey: ['squad', squadId, 'progress'],
    queryFn: () => squadMembersService.progress(squadId),
    // Each poll costs one walking-Directions call per member who is moving, so
    // this is deliberately slower than the map's own position stream.
    refetchInterval: 20_000,
  });

  const requests = useQuery({
    queryKey: ['squad', squadId, 'requests'],
    queryFn: () => squadMembersService.requests(squadId),
    enabled: can.admitMembers,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['squad', squadId] });
  };

  const decide = useMutation({
    mutationFn: ({ memberId, decision }: { memberId: string; decision: 'approve' | 'reject' }) =>
      squadMembersService.decide(squadId, memberId, decision),
    onSuccess: () => {
      setError(null);
      invalidate();
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not answer the request.'),
  });

  const setRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: SquadRole }) =>
      squadMembersService.setRole(squadId, userId, role),
    onSuccess: () => {
      setError(null);
      setOpenMenu(null);
      invalidate();
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not change the role.'),
  });

  const remove = useMutation({
    mutationFn: (userId: string) => squadMembersService.remove(squadId, userId),
    onSuccess: () => {
      setError(null);
      setOpenMenu(null);
      invalidate();
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not remove them.'),
  });

  if (progress.isPending) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  const items = progress.data?.items ?? [];
  const pending = requests.data ?? [];

  return (
    <div className="space-y-5">
      {error ? (
        <p role="alert" className="rounded-lg bg-danger/10 px-3.5 py-3 text-[13px] text-danger">
          {error}
        </p>
      ) : null}

      {can.admitMembers && pending.length > 0 ? (
        <section>
          <h3 className="mb-2 text-[13px] font-semibold text-ink">
            Requests to join ({pending.length})
          </h3>
          <ul className="space-y-2">
            {pending.map((request) => (
              <li
                key={request.id}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3"
              >
                <Avatar src={request.user.profilePhoto} name={request.user.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium text-ink">
                    {request.user.name}
                  </span>
                  {request.user.college ? (
                    <span className="block truncate text-[12px] text-ink-muted">
                      {request.user.college}
                    </span>
                  ) : null}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => decide.mutate({ memberId: request.id, decision: 'reject' })}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => decide.mutate({ memberId: request.id, decision: 'approve' })}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h3 className="mb-2 text-[13px] font-semibold text-ink">
          Members ({items.length})
        </h3>

        {items.length === 0 ? (
          <EmptyState title="Nobody here yet" description="Share the join code to add people." />
        ) : (
          <ul className="space-y-2">
            {items.map((entry) => {
              const badge = ROLE_BADGE[entry.role];
              const isSelf = entry.user.id === viewerId;
              const menuOpen = openMenu === entry.user.id;

              return (
                <li
                  key={entry.user.id}
                  className={cn(
                    'relative flex items-center gap-3 rounded-xl border bg-surface px-3.5 py-3',
                    entry.status === 'arrived' ? 'border-brand/40' : 'border-line',
                  )}
                >
                  <Avatar
                    src={entry.user.profilePhoto}
                    name={entry.user.name}
                    size="sm"
                    online={entry.status === 'travelling'}
                  />

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[13.5px] font-medium text-ink">
                        {entry.user.name}
                        {isSelf ? ' (you)' : ''}
                      </span>
                      {badge ? (
                        <badge.Icon className="h-3.5 w-3.5 shrink-0 text-warning" />
                      ) : null}
                      {entry.role === 'guest' ? <Badge>Guest</Badge> : null}
                    </span>
                    <span className="flex items-center gap-1.5 text-[12px] text-ink-muted">
                      {entry.distanceMetres !== null && entry.status !== 'arrived' ? (
                        <>{formatDistance(entry.distanceMetres)} away</>
                      ) : entry.status === 'arrived' ? (
                        <>At the meeting point</>
                      ) : (
                        <>Location not shared</>
                      )}
                      {/* Battery only when it is low enough to explain a member
                          who has stopped updating. */}
                      {entry.battery !== null && entry.battery <= 20 ? (
                        <span className="inline-flex items-center gap-0.5 text-danger">
                          <BatteryLow className="h-3 w-3" />
                          {entry.battery}%
                        </span>
                      ) : null}
                    </span>
                  </span>

                  <span
                    className={cn(
                      'shrink-0 text-[12.5px] font-medium tabular-nums',
                      entry.status === 'arrived' ? 'text-brand' : 'text-ink',
                    )}
                  >
                    {formatEta(entry)}
                  </span>

                  {can.manageMembers && !isSelf && entry.role !== 'leader' ? (
                    <button
                      type="button"
                      aria-label={`Manage ${entry.user.name}`}
                      onClick={() => setOpenMenu(menuOpen ? null : entry.user.id)}
                      className="shrink-0 rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  ) : null}

                  {menuOpen ? (
                    <div className="absolute right-2 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border border-line bg-surface shadow-float">
                      {can.assignRoles ? (
                        <>
                          <MenuItem
                            label={entry.role === 'co-leader' ? 'Make member' : 'Make co-leader'}
                            onClick={() =>
                              setRole.mutate({
                                userId: entry.user.id,
                                role: entry.role === 'co-leader' ? 'member' : 'co-leader',
                              })
                            }
                          />
                          <MenuItem
                            label="Hand over leadership"
                            onClick={() =>
                              setRole.mutate({ userId: entry.user.id, role: 'leader' })
                            }
                          />
                        </>
                      ) : null}
                      <MenuItem
                        label="Remove from squad"
                        tone="danger"
                        Icon={UserMinus}
                        onClick={() => remove.mutate(entry.user.id)}
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function MenuItem({
  label,
  onClick,
  tone,
  Icon,
}: {
  label: string;
  onClick: () => void;
  tone?: 'danger';
  Icon?: typeof UserMinus;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] transition-colors',
        tone === 'danger'
          ? 'text-danger hover:bg-danger/10'
          : 'text-ink hover:bg-surface-sunken',
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {label}
    </button>
  );
}
