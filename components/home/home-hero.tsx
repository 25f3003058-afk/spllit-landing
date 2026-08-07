'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, MapPin } from 'lucide-react';

import { cn, greetingFor, firstNameOf } from '@/lib/utils';
import { InstituteMark } from '@/components/shared/institute-picker';
import { VerifiedChip } from '@/components/shared/verify-institute';
import { Avatar } from '@/components/ui/avatar';
import type { Institute } from '@/content/institutes';
import type { User } from '@/types';

/**
 * Dashboard hero.
 *
 * Carries the same language as the marketing page — one oversized question,
 * tight tracking, a glass prompt over a tinted field — so signing in doesn't
 * feel like landing in a different product. The prompt is the primary action
 * rather than one chip among five, because posting or finding a ride is the
 * thing people actually open this for.
 */
export function HomeHero({
  profile,
  institute,
  placeLabel,
  locationDenied,
  onEnableLocation,
}: {
  profile: User | null;
  institute: Institute | null;
  placeLabel: string | null;
  locationDenied: boolean;
  onEnableLocation: () => void;
}) {
  const router = useRouter();
  const [destination, setDestination] = useState('');

  const submit = () => {
    const to = destination.trim();
    router.push(to ? `/rides/new?to=${encodeURIComponent(to)}` : '/rides/new');
  };

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[28px] border border-line',
        // A soft brand wash rather than flat white: gives the prompt card
        // something to sit on, which is what the glass treatment needs.
        'bg-[radial-gradient(120%_140%_at_15%_0%,var(--brand-muted)_0%,transparent_55%)]',
        'bg-surface p-5 sm:p-7',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-sans text-[12.5px] font-medium uppercase tracking-[0.08em] text-ink-subtle">
            {greetingFor()}
          </p>
          <h1 className="mt-1.5 font-sans text-[clamp(26px,5vw,38px)] font-medium leading-[1.05] tracking-[-0.04em] text-ink">
            Where are you headed,{' '}
            <span className="text-brand">{firstNameOf(profile?.name)}</span>?
          </h1>
        </div>

        <Link href="/profile" className="shrink-0" aria-label="Your profile">
          <Avatar src={profile?.profilePhoto} name={profile?.name} size="lg" />
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {institute ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-sunken py-1 pl-1 pr-3">
            <InstituteMark institute={institute} size="sm" />
            <span className="font-sans text-[12px] font-medium text-ink">
              {institute.code}
            </span>
          </span>
        ) : null}

        <VerifiedChip verified={Boolean(profile?.instituteVerified)} />

        <button
          onClick={locationDenied ? onEnableLocation : undefined}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full bg-surface-sunken px-3 py-1.5',
            'font-sans text-[12px] text-ink-muted',
            locationDenied && 'transition-colors hover:text-ink',
          )}
        >
          <MapPin className="h-3 w-3" />
          {locationDenied ? 'Turn on location' : (placeLabel ?? 'Near you')}
        </button>
      </div>

      {/* Prompt card */}
      <div className="liquid-glass mt-6 overflow-hidden rounded-[24px]">
        <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-2 sm:p-3">
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
            aria-label="Where are you going?"
            placeholder="Airport, station, anywhere…"
            className={cn(
              'w-full flex-1 bg-transparent px-3 py-3 sm:py-2',
              'font-sans text-[16px] font-medium text-ink outline-none',
              'placeholder:font-normal placeholder:text-ink-subtle',
            )}
          />
          <button
            onClick={submit}
            className={cn(
              'flex h-12 shrink-0 items-center justify-center gap-2 rounded-[18px] bg-ink px-6',
              'font-sans text-[14px] font-medium uppercase tracking-[0.03em] text-canvas',
              'transition-all duration-snap hover:opacity-85 active:scale-95',
            )}
          >
            Offer a ride
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
