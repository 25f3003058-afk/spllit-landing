'use client';

/**
 * Referral capture.
 *
 * The `?ref=` on an invite link lands on the marketing page, but the account is
 * not created until the very end of sign-in and onboarding — several redirects
 * and, for Google, a full page navigation away. Holding the handle in memory
 * would lose it every time.
 *
 * So it is parked in localStorage on arrival and read once at bootstrap. It is
 * a hint, not a credential: the server re-resolves the handle, ignores unknown
 * ones and refuses self-referral, so a tampered value can only name a different
 * real user — never grant anything.
 */

import { hasConsent } from '@/lib/consent';

const KEY = 'spllit.referral';
/** Matches the server's username rules; anything else is not worth storing. */
const HANDLE = /^[a-z0-9_]{3,20}$/;

/** Reads `?ref=` off the current URL and remembers it. Safe to call repeatedly. */
export function captureReferral(): void {
  if (typeof window === 'undefined') return;

  const ref = new URLSearchParams(window.location.search).get('ref');
  if (!ref) return;

  const handle = ref.trim().toLowerCase();
  if (!HANDLE.test(handle)) return;

  // Persisting the handle is a preference, not a necessity — signing in works
  // without it, so it waits for consent rather than assuming it.
  if (!hasConsent('preferences')) return;

  try {
    // First link wins. Someone who arrives via two invites was brought in by
    // the first person to reach them, and overwriting rewards whoever happened
    // to send the most recent message.
    if (!window.localStorage.getItem(KEY)) {
      window.localStorage.setItem(KEY, handle);
    }
  } catch {
    // Storage is blocked in private mode and some in-app browsers. Attribution
    // is a nice-to-have; sign-in is not, so this must never throw.
  }
}

export function readReferral(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Called once the account exists, so a second signup cannot reuse the handle. */
export function clearReferral(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to do — a stale handle is only ever applied on create.
  }
}
