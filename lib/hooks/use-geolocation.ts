'use client';

import { useCallback, useEffect, useState } from 'react';

import { config } from '@/lib/config';
import type { LngLat } from '@/types';

export type GeoStatus = 'idle' | 'prompting' | 'granted' | 'denied' | 'unavailable';

const STORAGE_KEY = 'spllit:last-known-location';

function readCached(): LngLat | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      Array.isArray(parsed) &&
      parsed.length === 2 &&
      typeof parsed[0] === 'number' &&
      typeof parsed[1] === 'number'
    ) {
      return [parsed[0], parsed[1]];
    }
  } catch {
    // Corrupt cache is not worth surfacing — fall through to the default.
  }
  return null;
}

/** Why a deliberate "where am I" request produced no position. */
export type FixFailure = 'denied' | 'unavailable' | 'timeout';

export type PreciseFix =
  | { status: 'ok'; point: LngLat; accuracyMetres: number }
  | { status: FixFailure };

/**
 * One high-accuracy position, asked for because the user asked for it.
 *
 * Deliberately not `useGeolocation`. That hook exists to keep a map pointed
 * somewhere plausible, so it falls back to the last known position and then to
 * the configured default city, and it reports the outcome as `isApproximate`.
 * Both of those are exactly wrong for "use my current location": a button that
 * silently drops a pin on Chennai's centroid when the permission was denied is
 * worse than a button that says the permission was denied.
 *
 * So this resolves to the real fix or to the reason there isn't one, and never
 * to a substitute. `maximumAge: 0` for the same reason — the user is asking
 * where they are *now*, not where the app last saw them.
 */
export function getPreciseLocation(): Promise<PreciseFix> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve({ status: 'unavailable' });
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          status: 'ok',
          point: [pos.coords.longitude, pos.coords.latitude],
          accuracyMetres: pos.coords.accuracy,
        }),
      (error) => {
        // The three codes are PERMISSION_DENIED, POSITION_UNAVAILABLE and
        // TIMEOUT. Anything else is treated as unavailable.
        if (error.code === error.PERMISSION_DENIED) return resolve({ status: 'denied' });
        if (error.code === error.TIMEOUT) return resolve({ status: 'timeout' });
        resolve({ status: 'unavailable' });
      },
      // Longer than the hook's 8s: a first high-accuracy fix indoors regularly
      // takes over ten seconds, and timing out early on a user-initiated action
      // reads as the button being broken.
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  });
}

/**
 * Above this, a GPS fix is too vague to be presented as a meeting point without
 * saying so. Around 100 m is the difference between a doorway and a street.
 */
export const VAGUE_FIX_METRES = 100;

/**
 * Geolocation with a graceful fallback chain (Section 6.2):
 *   live GPS → last known position (localStorage) → configured default city.
 * `center` is therefore never null after the first tick, so the map always has
 * somewhere to point and never renders blank.
 */
export function useGeolocation(options?: { watch?: boolean }) {
  const [center, setCenter] = useState<LngLat | null>(null);
  const [status, setStatus] = useState<GeoStatus>('idle');
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const fallback: LngLat = [config.defaultLocation.lng, config.defaultLocation.lat];

  const request = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unavailable');
      setCenter(readCached() ?? fallback);
      return;
    }

    setStatus('prompting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next: LngLat = [pos.coords.longitude, pos.coords.latitude];
        setCenter(next);
        setAccuracy(pos.coords.accuracy);
        setStatus('granted');
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Storage can be blocked; the in-memory value still works this session.
        }
      },
      () => {
        setStatus('denied');
        setCenter(readCached() ?? fallback);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
    // fallback is derived from static config and never changes at runtime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Deferred to a microtask so the first render commits and paints before
    // `request` flips status to 'prompting'. Calling it synchronously here
    // forces a second render pass before the browser has shown anything,
    // which is exactly the cascade the shell/skeleton design avoids.
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) request();
    });
    return () => {
      cancelled = true;
    };
  }, [request]);

  useEffect(() => {
    if (!options?.watch || status !== 'granted') return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setCenter([pos.coords.longitude, pos.coords.latitude]);
        setAccuracy(pos.coords.accuracy);
      },
      () => {
        /* transient watch failures keep the last good position */
      },
      { enableHighAccuracy: true, maximumAge: 10_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [options?.watch, status]);

  return {
    center,
    accuracy,
    status,
    /** True when we are showing a fallback rather than the real device position. */
    isApproximate: status !== 'granted',
    placeLabel: status === 'granted' ? null : config.defaultLocation.label,
    request,
  };
}
