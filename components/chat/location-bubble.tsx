'use client';

import { MapPin, Navigation } from 'lucide-react';

import { cn } from '@/lib/utils';
import { config } from '@/lib/config';

/**
 * A shared location, rendered as a map rather than a pair of numbers.
 *
 * Uses Mapbox's Static Images API — a plain <img>, not a map instance. A
 * conversation can hold dozens of these, and spinning up a GL context per
 * bubble would cost more memory than the rest of the app combined.
 */
export interface LocationMetadata {
  lat: number;
  lng: number;
  label?: string | null;
  /** Set when the sender was reporting where they are, not naming a place. */
  live?: boolean;
}

/** Narrows a message's untyped metadata to a usable coordinate pair. */
export function readLocation(metadata: Record<string, unknown> | null): LocationMetadata | null {
  if (!metadata) return null;
  const lat = Number(metadata.lat);
  const lng = Number(metadata.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return {
    lat,
    lng,
    label: typeof metadata.label === 'string' ? metadata.label : null,
    live: metadata.live === true,
  };
}

export function LocationBubble({
  location,
  mine,
  className,
}: {
  location: LocationMetadata;
  mine: boolean;
  className?: string;
}) {
  const { lat, lng, label, live } = location;

  /**
   * A pin drawn by Mapbox rather than overlaid in CSS, so it stays centred
   * whatever the container does. `@2x` because these are small and would
   * otherwise look soft on any phone made this decade.
   */
  const preview = config.mapbox.token
    ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/` +
      `pin-s+00c853(${lng.toFixed(5)},${lat.toFixed(5)})/` +
      `${lng.toFixed(5)},${lat.toFixed(5)},14,0/320x160@2x` +
      `?access_token=${config.mapbox.token}&logo=false&attribution=false`
    : null;

  const directions = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <a
      href={directions}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'block w-[220px] overflow-hidden rounded-2xl border shadow-soft transition-shadow hover:shadow-raised',
        mine ? 'rounded-br-md border-transparent' : 'rounded-bl-md border-line',
        className,
      )}
    >
      {preview ? (
        /* A signed Mapbox URL, not a project asset. next/image would route
           every tile through the optimiser for no gain — Mapbox already
           returns a correctly sized @2x raster. */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt={label ? `Map showing ${label}` : 'Shared location on a map'}
          width={320}
          height={160}
          loading="lazy"
          className="h-[110px] w-full object-cover"
        />
      ) : (
        <div className="flex h-[110px] items-center justify-center bg-surface-sunken">
          <MapPin className="h-5 w-5 text-ink-subtle" />
        </div>
      )}

      <div className={cn('px-3 py-2', mine ? 'bg-brand text-brand-fg' : 'bg-surface text-ink')}>
        <p className="flex items-center gap-1.5 text-[13px] font-medium">
          {live ? <Navigation className="h-3.5 w-3.5 shrink-0" /> : <MapPin className="h-3.5 w-3.5 shrink-0" />}
          <span className="truncate">{label ?? (live ? 'Shared their location' : 'Location')}</span>
        </p>
        <p className={cn('mt-0.5 text-[11px]', mine ? 'text-brand-fg/70' : 'text-ink-subtle')}>
          Tap for directions
        </p>
      </div>
    </a>
  );
}
