'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

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

      {/*
        The three feature cards that used to sit here are gone.

        They duplicated navigation that already exists — the tab bar and the
        create button reach Rides, Squads and Map from every screen — so on the
        one screen where a returning user wants to see their own activity, the
        first thing they got was a second copy of the menu. A greeting is a
        greeting; it does not need to be a launcher.

        Verification is the exception and stays: it is not navigation, it is the
        one thing blocking the account from doing anything, and it renders only
        while it is unresolved.
      */}
      {profile && !profile.instituteVerified ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface-sunken px-4 py-3">
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
