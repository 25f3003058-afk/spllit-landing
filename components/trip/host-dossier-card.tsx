'use client';

import Link from 'next/link';
import { Car, MessageCircle, Phone, Star } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import type { HostDossier } from '@/types';

/**
 * The driver, as a rider sees them once they are actually on the trip.
 *
 * Deliberately shown only for an accepted match. The phone number and the
 * registration are the two facts that make a stranger's car safe to get into,
 * and handing them to anyone who can guess a ride id would undo the entire
 * verification chain — so the server withholds them and this renders nothing
 * it was not given.
 */
export function HostDossierCard({
  dossier,
  threadId,
  className,
}: {
  dossier: HostDossier;
  threadId?: string | null;
  className?: string;
}) {
  const { user, vehicle } = dossier;

  return (
    <div className={cn('rounded-2xl border border-line bg-surface p-5', className)}>
      <div className="flex items-start gap-3.5">
        <Avatar src={user.profilePhoto} name={user.name} size="lg" />

        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[17px] font-semibold tracking-[-0.01em] text-ink">
            {user.name}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] text-ink-muted">
            {/* A rating out of nothing is noise; say how many it is built on. */}
            {dossier.ratingCount > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3 w-3 fill-warning text-warning" />
                {dossier.rating.toFixed(1)}
                <span className="text-ink-subtle">({dossier.ratingCount})</span>
              </span>
            ) : (
              <span className="text-ink-subtle">No ratings yet</span>
            )}
            <span aria-hidden>·</span>
            <span>
              {dossier.ridesHosted} {dossier.ridesHosted === 1 ? 'trip' : 'trips'} hosted
            </span>
            {user.college ? (
              <>
                <span aria-hidden>·</span>
                <span className="truncate">{user.college}</span>
              </>
            ) : null}
          </p>

          {dossier.about ? (
            <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{dossier.about}</p>
          ) : null}
        </div>
      </div>

      {vehicle ? (
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-surface-sunken px-4 py-3">
          <Car className="h-[18px] w-[18px] shrink-0 text-ink-muted" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-medium text-ink">
              {vehicle.brandLabel} {vehicle.modelLabel}
              {vehicle.colour ? ` · ${vehicle.colour}` : ''}
            </p>
            <p className="text-[12px] text-ink-muted">
              {vehicle.seats} {vehicle.seats === 1 ? 'seat' : 'seats'}
            </p>
          </div>
          <p className="shrink-0 rounded-md border border-line bg-surface px-2.5 py-1 font-mono text-[13px] tracking-[0.1em] text-ink">
            {vehicle.plateFormatted}
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex gap-2">
        {threadId ? (
          <Link
            href={`/chat/${threadId}`}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-ink text-[14px] font-medium text-canvas transition-opacity hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" />
            Message
          </Link>
        ) : null}

        {dossier.phone ? (
          <a
            href={`tel:${dossier.phone}`}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-line-strong text-[14px] font-medium text-ink transition-colors hover:bg-surface-sunken"
          >
            <Phone className="h-4 w-4" />
            Call
          </a>
        ) : null}
      </div>
    </div>
  );
}
