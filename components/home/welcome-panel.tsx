'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ArrowRight, Car, MapPin, Users, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-provider';
import { firstNameOf } from '@/lib/utils';

const DISMISS_KEY = 'spllit.welcome.dismissed';

/**
 * Dismissal, read straight from localStorage.
 *
 * useSyncExternalStore rather than an effect: localStorage does not exist while
 * prerendering, and the server snapshot reports "dismissed" so the panel is
 * never in the HTML. It appears on the client only if it genuinely has not been
 * dismissed, which avoids a hydration mismatch and a flash of a panel the user
 * already closed.
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

function useDismissed() {
  return useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(DISMISS_KEY) === '1',
    () => true,
  );
}

/** The three things a new account can actually do on day one. */
const FEATURES = [
  {
    title: 'Rides',
    body: 'Post a ride or take a seat with someone already heading your way.',
    Icon: Car,
    actions: [
      { label: 'Find a ride', href: '/rides' },
      { label: 'Offer a ride', href: '/rides/new' },
    ],
  },
  {
    title: 'Squads',
    body: 'Travelling somewhere together? Pick a destination and a meeting point.',
    Icon: Users,
    actions: [
      { label: 'Start a squad', href: '/squads/new' },
      { label: 'Browse squads', href: '/squads' },
    ],
  },
  {
    title: 'Map',
    body: 'See who is nearby, where squads are gathering, and what is on today.',
    Icon: MapPin,
    actions: [{ label: 'Open the map', href: '/map' }],
  },
] as const;

export function WelcomePanel({ className }: { className?: string }) {
  const dismissed = useDismissed();
  const { profile } = useAuth();

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, '1');
    listeners.forEach((notify) => notify());
  };

  if (dismissed) return null;

  return (
    <section
      aria-labelledby="welcome-heading"
      className={cn('rounded-xl border border-line bg-surface p-5', className)}
    >
      <div className="flex items-start justify-between gap-4">
        <h2
          id="welcome-heading"
          className="font-display text-[19px] font-semibold tracking-[-0.02em] text-ink"
        >
          Welcome to Spllit{profile?.name ? `, ${firstNameOf(profile.name)}` : ''}
        </h2>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss welcome"
          className="-mr-1 -mt-1 shrink-0 rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {FEATURES.map(({ title, body, Icon, actions }) => (
          <div
            key={title}
            className="rounded-lg border border-line p-4 transition-colors hover:border-line-strong"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-sunken text-ink-muted">
              <Icon className="h-4 w-4" />
            </span>
            <p className="mt-3 text-[14px] font-semibold text-ink">{title}</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">{body}</p>
            <div className="mt-3 space-y-1.5">
              {actions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-1 text-[12.5px] font-medium text-brand transition-opacity hover:opacity-80"
                >
                  {action.label}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Verification is the one thing that gates real use, so it sits below the
          features as a single row rather than competing with them. */}
      {profile && !profile.instituteVerified ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface-sunken px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-ink">Verify your institute email</p>
            <p className="mt-0.5 text-[12.5px] text-ink-muted">
              Creating and joining rides needs a confirmed campus address.
            </p>
          </div>
          <Link
            href="/profile"
            className="shrink-0 rounded-full bg-ink px-3.5 py-1.5 text-[12.5px] font-semibold text-canvas transition-opacity hover:opacity-90"
          >
            Verify now
          </Link>
        </div>
      ) : null}
    </section>
  );
}
