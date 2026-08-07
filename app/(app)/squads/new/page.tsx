'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Flag, MapPin, User, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Segmented } from '@/components/ui/tabs';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { PlacePicker, type PickedPlace } from '@/components/shared/place-picker';
import { VerifyInstituteBanner } from '@/components/shared/verify-institute';
import { useCreateSquad, useMySquads } from '@/lib/hooks/queries';
import { useGeolocation } from '@/lib/hooks/use-geolocation';
import { useAuth } from '@/lib/auth/auth-provider';
import { SQUAD_PURPOSES, purposeLabel, suggestSquadName } from '@/lib/squad-purpose';
import { cn, formatDistance, haversine } from '@/lib/utils';
import type { SquadType } from '@/types';

/** Capacities offered, including the leader. Matches the spec's ladder. */
const CAPACITIES = [2, 3, 4, 5, 6, 8, 10] as const;

function startOfTomorrow(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return date;
}

function inOneHour(): Date {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);
  return date;
}

export default function NewSquadPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { center } = useGeolocation();
  const create = useCreateSquad();
  const mySquads = useMySquads();

  /**
   * The squad this user already leads, if any. Only leadership blocks creating
   * another — being a member of somebody else's squad does not.
   */
  const activeSquad = (mySquads.data ?? []).find(
    (squad) => squad.viewerRole === 'leader' && squad.status === 'active',
  );

  const [destination, setDestination] = useState<PickedPlace | null>(null);
  const [name, setName] = useState('');
  /**
   * Once the leader edits the name we stop regenerating it. Without this,
   * changing the purpose afterwards would silently discard what they typed.
   */
  const [nameTouched, setNameTouched] = useState(false);
  const [purpose, setPurpose] = useState<SquadType>('college');
  const [departAt, setDepartAt] = useState<Date | null>(null);
  const [capacity, setCapacity] = useState<number>(4);
  const [visibility, setVisibility] = useState<'public' | 'invite'>('public');
  const [meetingPoint, setMeetingPoint] = useState<PickedPlace | null>(null);

  const suggestedName = destination ? suggestSquadName(destination.label, purpose) : '';
  const effectiveName = nameTouched ? name : suggestedName;

  /** Meeting point offset, shown so the leader can sanity-check the pin. */
  const meetingOffset = useMemo(() => {
    if (!destination || !meetingPoint) return null;
    return haversine([destination.lng, destination.lat], [meetingPoint.lng, meetingPoint.lat]);
  }, [destination, meetingPoint]);

  const applyDestination = (place: PickedPlace | null) => {
    setDestination(place);
    // Keep the suggestion live until the leader takes the name over.
    if (!nameTouched) setName(place ? suggestSquadName(place.label, purpose) : '');
  };

  const applyPurpose = (next: SquadType) => {
    setPurpose(next);
    if (!nameTouched && destination) setName(suggestSquadName(destination.label, next));
  };

  const canSubmit = Boolean(destination) && effectiveName.trim().length >= 2;

  const submit = () => {
    if (!destination || !canSubmit) return;
    create.mutate(
      {
        name: effectiveName.trim(),
        type: purpose,
        visibility,
        memberLimit: capacity,
        destination: {
          lat: destination.lat,
          lng: destination.lng,
          label: destination.label,
          address: destination.address,
        },
        ...(profile?.college ? { college: profile.college } : {}),
        ...(meetingPoint
          ? {
              meetingPoint: {
                lat: meetingPoint.lat,
                lng: meetingPoint.lng,
                label: meetingPoint.label,
              },
            }
          : {}),
        ...(departAt ? { meetingAt: departAt.toISOString() } : {}),
      },
      { onSuccess: (squad) => router.replace(`/squads/${squad.id}`) },
    );
  };

  /**
   * The form is not rendered at all while the user already leads a squad.
   *
   * A disabled button was not enough — the page still invited them to fill in
   * a destination, a purpose and a departure time before discovering none of it
   * could be submitted. The API rejects it either way; this stops the wasted
   * effort.
   */
  if (activeSquad) {
    const where = activeSquad.destination?.label?.split(',')[0] ?? activeSquad.name;
    return (
      <div className="mx-auto max-w-lg space-y-6 pb-8">
        <div className="flex items-center gap-3">
          <Link
            href="/squads"
            aria-label="Back to squads"
            className="rounded-md p-2 text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-[22px] font-semibold tracking-[-0.025em] text-ink">
            Start a squad
          </h1>
        </div>

        <div className="rounded-xl border border-line bg-surface p-6 shadow-soft">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/15 text-warning">
            <Users className="h-5 w-5" />
          </span>
          <h2 className="mt-4 font-display text-[19px] font-semibold tracking-[-0.02em] text-ink">
            You already lead a squad
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">
            You are leading <span className="font-medium text-ink">{where}</span>. One
            squad at a time — running two splits the people who could have
            travelled together, and leaves both groups short.
          </p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">
            Mark it done or cancel it from the squad page, and this opens again.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={`/squads/${activeSquad.id}`}>
              <Button size="sm">Open {where}</Button>
            </Link>
            <Link href="/squads">
              <Button size="sm" variant="secondary">
                Back to squads
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <Link
          href="/squads"
          aria-label="Back to squads"
          className="rounded-md p-2 text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-[22px] font-semibold tracking-[-0.025em] text-ink">
          Start a squad
        </h1>
      </div>

      {/* Renders only when unverified, and self-hides the moment it succeeds.
          Placed above the form rather than beside the disabled button: finding
          out you are blocked *after* filling in six fields is the worst
          possible moment to be told. */}
      <VerifyInstituteBanner />

      {/* Step 1 — destination leads, because it is what people search for. */}
      <div>
        {/* Not a <label>: PlacePicker owns its own input id and takes its
            accessible name via `label`, so pointing htmlFor at it would
            reference an element that does not exist. The visible heading and
            the accessible name are kept identical instead. */}
        <p className="mb-2 font-display text-[17px] font-semibold tracking-[-0.02em] text-ink">
          Where is everyone going?
        </p>
        <PlacePicker
          label="Where is everyone going?"
          value={destination}
          onChange={applyDestination}
          placeholder="Search destination…"
          proximity={center}
        />
        <p className="mt-2 text-[12px] text-ink-subtle">
          Everything else is optional — you can set the meeting point later.
        </p>
      </div>

      {destination ? (
        <div className="space-y-5">
          {/* Step 2 — name, pre-filled from destination + purpose. */}
          <Field label="Squad name" hint="Auto-named. Edit if you like." htmlFor="squad-name">
            <Input
              id="squad-name"
              value={effectiveName}
              onChange={(e) => {
                setNameTouched(true);
                setName(e.target.value);
              }}
            />
          </Field>

          {/* Step 3 — purpose. */}
          <div>
            <span className="mb-2 block text-[13px] font-medium text-ink">What&apos;s the trip for?</span>
            <div className="flex flex-wrap gap-2">
              {SQUAD_PURPOSES.map((option) => {
                const active = option.value === purpose;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => applyPurpose(option.value)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5',
                      'text-[13px] font-medium transition-colors',
                      active
                        ? 'border-transparent bg-brand text-white'
                        : 'border-line text-ink-muted hover:bg-surface-sunken hover:text-ink',
                    )}
                  >
                    {/* Decorative: the label already names the purpose, so the
                        icon must not be announced twice. */}
                    <span aria-hidden="true">{option.icon}</span>
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4 — departure. */}
          <div>
            <span className="mb-2 block text-[13px] font-medium text-ink">Leaving</span>
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDepartAt(inOneHour())}
                className="rounded-full border border-line px-3.5 py-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
              >
                Within the hour
              </button>
              <button
                type="button"
                onClick={() => setDepartAt(startOfTomorrow())}
                className="rounded-full border border-line px-3.5 py-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
              >
                Tomorrow morning
              </button>
              {departAt ? (
                <button
                  type="button"
                  onClick={() => setDepartAt(null)}
                  className="rounded-full px-3.5 py-1.5 text-[13px] font-medium text-ink-subtle transition-colors hover:text-ink"
                >
                  Clear
                </button>
              ) : null}
            </div>
            {/* Same picker as rides and events — one calendar across the app,
                so "when are you leaving" never looks like a different question
                depending on which screen asked it. */}
            <DateTimePicker value={departAt} onChange={setDepartAt} />
          </div>

          {/* Step 5 — capacity. */}
          <div>
            <span className="mb-2 block text-[13px] font-medium text-ink">How many people?</span>
            <div className="flex flex-wrap gap-2">
              {CAPACITIES.map((size) => {
                const active = size === capacity;
                return (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setCapacity(size)}
                    className={cn(
                      'h-10 w-10 rounded-full border text-[13px] font-medium transition-colors',
                      active
                        ? 'border-transparent bg-brand text-white'
                        : 'border-line text-ink-muted hover:bg-surface-sunken hover:text-ink',
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="flex gap-0.5" aria-hidden="true">
                {Array.from({ length: capacity }, (_, index) => (
                  <User
                    key={index}
                    className={cn('h-4 w-4', index === 0 ? 'text-brand' : 'text-ink-subtle')}
                  />
                ))}
              </span>
              <span className="text-[13px] text-ink-muted">
                {capacity} people{' '}
                <span className="text-ink-subtle">(you + {capacity - 1} others)</span>
              </span>
            </div>
          </div>

          {/* Step 6 — visibility. */}
          <div>
            <span className="mb-2 block text-[13px] font-medium text-ink">Who can join?</span>
            <Segmented
              value={visibility}
              onChange={setVisibility}
              items={[
                { value: 'public', label: 'Public' },
                { value: 'invite', label: 'Invite only' },
              ]}
            />
            <p className="mt-2 text-[12px] text-ink-subtle">
              {visibility === 'public'
                ? 'Nearby people heading the same way can find and join this squad.'
                : 'Only people you invite with a link or code can join.'}
            </p>
          </div>

          {/* Step 8 — meeting point. Never blank: skipping the picker means the
              destination itself, decided server-side so every client agrees. */}
          <Field
            label="Meeting point"
            hint={
              meetingPoint
                ? undefined
                : `Defaults to ${destination.label.split(',')[0]} if you skip it.`
            }
          >
            <PlacePicker
              label="Meeting point"
              value={meetingPoint}
              onChange={setMeetingPoint}
              placeholder="Where do you regroup first?"
              /* Bias suggestions to the destination, not the leader's current
                 position — the meeting point is usually near where they are
                 going, and often nowhere near where they are standing. */
              proximity={[destination.lng, destination.lat]}
            />
          </Field>

          {/* Step 9 — live preview of the card others will see. */}
          <div>
            <span className="mb-2 block text-[13px] font-medium text-ink">Preview</span>
            <div className="rounded-xl border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-[17px] font-semibold tracking-[-0.02em] text-ink">
                    {destination.label.split(',')[0]}
                  </p>
                  <p className="truncate text-[13px] text-ink-muted">
                    {effectiveName.trim() || 'Untitled squad'}
                  </p>
                </div>
                <Badge tone={visibility === 'public' ? 'brand' : 'neutral'}>
                  {visibility === 'public' ? 'Public' : 'Invite'}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-ink-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />1 / {capacity}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Flag className="h-3.5 w-3.5" />
                  {purposeLabel(purpose)}
                </span>
                {departAt ? (
                  <span>
                    {departAt.toLocaleDateString(undefined, { weekday: 'short' })}{' '}
                    {departAt.toLocaleTimeString(undefined, {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                ) : (
                  <span className="text-ink-subtle">No departure time</span>
                )}
              </div>

              <div className="mt-3 flex items-start gap-1.5 border-t border-line pt-3 text-[13px]">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-subtle" />
                {meetingPoint ? (
                  <span className="text-ink-muted">
                    Meet at <span className="text-ink">{meetingPoint.label.split(',')[0]}</span>
                    {meetingOffset !== null ? (
                      <span className="text-ink-subtle">
                        {' '}
                        · {formatDistance(meetingOffset)} from {destination.label.split(',')[0]}
                      </span>
                    ) : null}
                  </span>
                ) : (
                  /* Mirrors the server-side default so the preview never shows
                     a squad in a state the backend will not actually create. */
                  <span className="text-ink-muted">
                    Meet at <span className="text-ink">{destination.label.split(',')[0]}</span>
                    <span className="text-ink-subtle"> · default</span>
                  </span>
                )}
              </div>

              <p className="mt-3 text-[12px] text-ink-subtle">
                {profile?.name ? `${profile.name} leads` : 'You lead'} this squad.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Step 10 — CTA. */}
      <Button
        size="lg"
        className="w-full"
        disabled={!canSubmit}
        loading={create.isPending}
        onClick={submit}
      >
        Create squad
      </Button>

      {create.isError ? (
        <p role="alert" className="text-[13px] text-danger">
          {create.error instanceof Error ? create.error.message : "Couldn't create the squad."}
        </p>
      ) : null}
    </div>
  );
}
