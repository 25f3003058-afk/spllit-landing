'use client';

import { useSyncExternalStore } from 'react';

/**
 * Cookie / storage consent.
 *
 * Spllit sets no advertising or cross-site tracking cookies today. What it does
 * store is: a Firebase auth session, a referral handle, and a few dismissed-
 * banner flags. The first is strictly necessary — without it nobody stays
 * signed in — and under GDPR/ePrivacy strictly necessary storage does not
 * require consent. The rest is not, which is what this gate is for.
 *
 * Analytics is listed because getAnalytics() is deliberately not called today
 * (see lib/firebase.ts); wiring it up later must check `analytics` here rather
 * than firing on load.
 */

export interface ConsentState {
  /** Auth session and CSRF. Always on — the app cannot function without it. */
  necessary: true;
  /** Remembering dismissed banners, referral handle, last-used filters. */
  preferences: boolean;
  /** Usage measurement. Nothing reads this yet. */
  analytics: boolean;
  /** ISO timestamp, so a policy change can invalidate an old decision. */
  decidedAt: string;
  /** Bumped when the policy materially changes, forcing a re-ask. */
  version: number;
}

export const CONSENT_VERSION = 1;
const KEY = 'spllit.consent';

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((notify) => notify());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

/**
 * Memoised snapshot.
 *
 * useSyncExternalStore calls getSnapshot on every render and compares the
 * result by reference. JSON.parse allocates a fresh object each time, so
 * returning it directly made React believe the store had changed on every
 * render — an infinite re-render loop that crashed the entire app with
 * "Maximum update depth exceeded", not just the banner.
 *
 * The raw string is the cache key: identical string, identical object.
 */
let cachedRaw: string | null | undefined;
let cachedValue: ConsentState | null = null;

function parse(raw: string | null): ConsentState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ConsentState;
    // A stored decision against an older policy is not a decision about this
    // one, so it is treated as unanswered rather than silently honoured.
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function read(): ConsentState | null {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    // Storage blocked entirely — treat as undecided, and keep the reference
    // stable so this path cannot loop either.
    raw = null;
  }

  if (raw === cachedRaw) return cachedValue;
  cachedRaw = raw;
  cachedValue = parse(raw);
  return cachedValue;
}

export function saveConsent(choice: { preferences: boolean; analytics: boolean }): void {
  const state: ConsentState = {
    necessary: true,
    preferences: choice.preferences,
    analytics: choice.analytics,
    decidedAt: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage blocked. The banner will ask again next visit, which is the
    // correct outcome — an un-recordable decision is not a decision.
  }
  emit();
}

/**
 * The stored decision, or null if the user has not answered.
 *
 * Server snapshot is `undefined` rather than null so the banner is never in the
 * prerendered HTML — it would otherwise flash for people who already answered.
 */
export function useConsent(): ConsentState | null | undefined {
  return useSyncExternalStore(
    subscribe,
    read,
    () => undefined,
  );
}

/**
 * Whether a given category may be used. Call this before writing anything that
 * is not strictly necessary.
 */
export function hasConsent(category: 'preferences' | 'analytics'): boolean {
  if (typeof window === 'undefined') return false;
  return read()?.[category] ?? false;
}
