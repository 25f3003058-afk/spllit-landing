'use client';

import { Flag, MapPin, Navigation } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatDistance, formatDuration } from '@/lib/utils';
import type { Squad } from '@/types';

/**
 * The member's view of the journey: where the squad is going, where it gathers
 * first, and how far the viewer still has to walk.
 *
 * Deliberately two legs rather than one. A squad's destination is not where
 * anybody navigates to at this stage — they walk to the meeting point, and only
 * after everyone regroups does the destination matter. Collapsing the two would
 * send people straight past the group.
 */
export function SquadJourneyPanel({
  squad,
  distanceMetres,
  etaSeconds,
  arrived,
}: {
  squad: Squad;
  /** Live distance to the meeting point, from the viewer's own device. */
  distanceMetres: number | null;
  /** Server-computed walking ETA for the viewer, in seconds. */
  etaSeconds: number | null;
  arrived: boolean;
}) {
  const meeting = squad.meetingPoint;
  const destination = squad.destination;
  if (!meeting && !destination) return null;

  const head = (label: string | null | undefined) => label?.split(',')[0]?.trim() ?? null;

  /**
   * Walking mode explicitly: the meeting point is typically a few hundred
   * metres away, and driving directions to it would route around one-ways for
   * a two-minute walk.
   */
  const navigateHref = meeting
    ? `https://www.google.com/maps/dir/?api=1&destination=${meeting.lat},${meeting.lng}&travelmode=walking`
    : null;

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      {destination ? (
        <div className="flex items-start gap-2.5">
          <Flag className="mt-0.5 h-4 w-4 shrink-0 text-ink-subtle" />
          <div className="min-w-0">
            <p className="text-[12px] uppercase tracking-[0.06em] text-ink-subtle">Heading to</p>
            <p className="truncate font-display text-[17px] font-semibold tracking-[-0.02em] text-ink">
              {head(destination.label) ?? 'Destination'}
            </p>
          </div>
        </div>
      ) : null}

      {meeting ? (
        <div
          className={
            destination ? 'mt-4 border-t border-line pt-4' : undefined
          }
        >
          <div className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] uppercase tracking-[0.06em] text-ink-subtle">
                Meet first at
              </p>
              <p className="truncate text-[15px] font-medium text-ink">
                {head(meeting.label) ?? 'Meeting point'}
              </p>

              {arrived ? (
                <p className="mt-1.5 text-[13px] font-medium text-brand">You&apos;re here.</p>
              ) : distanceMetres !== null || etaSeconds !== null ? (
                <p className="mt-1.5 text-[13px] text-ink-muted">
                  {distanceMetres !== null ? `${formatDistance(distanceMetres)} away` : null}
                  {distanceMetres !== null && etaSeconds !== null ? ' · ' : null}
                  {etaSeconds !== null ? `${formatDuration(etaSeconds)} walk` : null}
                </p>
              ) : (
                <p className="mt-1.5 text-[13px] text-ink-subtle">
                  Share your location to see how far you are.
                </p>
              )}
            </div>
          </div>

          {navigateHref && !arrived ? (
            <a
              href={navigateHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block"
            >
              <Button size="lg" className="w-full">
                <Navigation className="h-4 w-4" />
                Navigate to meeting point
              </Button>
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
