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
