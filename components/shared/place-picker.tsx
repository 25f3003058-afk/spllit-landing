'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';

import { cn } from '@/lib/utils';
import { config } from '@/lib/config';
import { useClickOutside } from '@/lib/hooks/use-click-outside';
import { Input } from '@/components/ui/input';
import type { LngLat, PlaceResult } from '@/types';

interface GeocodeFeature {
  id: string;
  place_name: string;
  text: string;
  center: [number, number];
}

/**
 * Mapbox geocoding autocomplete.
 *
 * Uses the public token because this is an interactive, user-typed lookup that
 * has to feel instant. Directions and ETA still go through the server with the
 * secret token — those are the calls that would otherwise burn quota on every
 * render (Section 6.2).
 */
/** Roughly 110km at Indian latitudes — a plausible "same city or next town". */
const LOCAL_DEGREES = 1;

async function request(
  query: string,
  proximity: LngLat,
  bbox: boolean,
): Promise<PlaceResult[]> {
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
  );
  url.searchParams.set('access_token', config.mapbox.token);
  url.searchParams.set('limit', '5');
  url.searchParams.set('country', 'IN');
  url.searchParams.set('proximity', `${proximity[0]},${proximity[1]}`);

  if (bbox) {
    const [lng, lat] = proximity;
    url.searchParams.set(
      'bbox',
      [lng - LOCAL_DEGREES, lat - LOCAL_DEGREES, lng + LOCAL_DEGREES, lat + LOCAL_DEGREES]
        .map((value) => value.toFixed(4))
        .join(','),
    );
  }

  const response = await fetch(url.toString());
  if (!response.ok) return [];
  const payload = (await response.json()) as { features?: GeocodeFeature[] };
  return (payload.features ?? []).map((feature) => ({
    id: feature.id,
    name: feature.text,
    address: feature.place_name,
    center: feature.center,
  }));
}

/**
 * Local-first place search.
 *
 * Two problems produced "fortune tower" in Bengaluru for somebody standing in
 * Velachery:
 *
 *  1. `proximity` was only sent when the caller had a fix. `center` is null on
 *     the first render, so the earliest — and most-used — searches were ranked
 *     nationally. It now always falls back to the configured default city.
 *  2. `proximity` only *biases* Mapbox; it does not constrain. A well-known
 *     match 300km away still outranks a local one.
 *
 * So the first pass is bounded to roughly a city radius. That would break a
 * legitimate long-distance search — someone in Chennai looking up "Bengaluru
 * Airport" is exactly what a travel app is for — so an empty local result falls
 * back to a national search rather than insisting there is nothing.
 */
async function geocode(query: string, proximity?: LngLat | null): Promise<PlaceResult[]> {
  if (!config.mapbox.token) return [];

  const near: LngLat = proximity ?? [config.defaultLocation.lng, config.defaultLocation.lat];

  const local = await request(query, near, true);
  if (local.length > 0) return local;

  return request(query, near, false);
}

export interface PickedPlace {
  lat: number;
  lng: number;
  label: string;
  address: string | null;
}

/**
 * Turns a dropped pin into something a human can read back.
 *
 * Falls back to formatted coordinates rather than failing: a meeting point the
 * group agreed on by pointing at the map is still valid when Mapbox has no
 * name for that patch of road, and refusing to show it would lose the pin.
 */
export async function reverseGeocode(point: LngLat): Promise<PickedPlace> {
  const fallback: PickedPlace = {
    lat: point[1],
    lng: point[0],
    label: `${point[1].toFixed(5)}, ${point[0].toFixed(5)}`,
    address: null,
  };

  if (!config.mapbox.token) return fallback;

  try {
    const url = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${point[0]},${point[1]}.json`,
    );
    url.searchParams.set('access_token', config.mapbox.token);
    url.searchParams.set('limit', '1');
    // Street-level types only: a pin dropped on a road should not come back
    // named after the district it happens to sit in.
    url.searchParams.set('types', 'address,poi,neighborhood,place');

    const response = await fetch(url.toString());
    if (!response.ok) return fallback;

    const payload = (await response.json()) as { features?: GeocodeFeature[] };
    const feature = payload.features?.[0];
    if (!feature) return fallback;

    return {
      lat: point[1],
      lng: point[0],
      label: feature.text || fallback.label,
      address: feature.place_name ?? null,
    };
  } catch {
    return fallback;
  }
}

interface Anchor {
  top: number;
  left: number;
  width: number;
}

export function PlacePicker({
  value,
  onChange,
  placeholder = 'Search for a place',
  proximity,
  label,
}: {
  value: PickedPlace | null;
  onChange: (place: PickedPlace | null) => void;
  placeholder?: string;
  proximity?: LngLat | null;
  /** Accessible name. The visible caption is rendered by Field, not here. */
  label?: string;
}) {
  const inputId = useId();
  const [input, setInput] = useState(value?.label ?? '');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(input), 300);
    return () => clearTimeout(timer);
  }, [input]);

  const { data } = useQuery({
    queryKey: ['geocode', debounced, proximity],
    queryFn: () => geocode(debounced, proximity ?? undefined),
    enabled: debounced.trim().length >= 3 && open,
    staleTime: 5 * 60_000,
  });

  const results = data ?? [];
  const showList = open && results.length > 0;

  /**
   * The list is portalled to <body> and positioned against the input's own
   * rect.
   *
   * Rendering it inside the field looked fine in isolation and broke in every
   * real container: the trip planner's panel is `overflow-hidden` for its
   * rounded corners and clipped it outright, and inside a scrolling column it
   * scrolled away from its own input. A portal has no ancestor that can clip
   * it.
   */
  useLayoutEffect(() => {
    if (!showList) return;

    const measure = () => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;
      setAnchor({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    };

    measure();
    // `true` captures scrolls on any ancestor, not just the window, so the
    // list tracks a field inside a scrolling panel.
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [showList, results.length]);

  // Covers both the input and the portalled list, so clicking a suggestion is
  // not treated as clicking outside.
  useClickOutside(wrapperRef, () => {
    if (!listRef.current?.matches(':hover')) setOpen(false);
  });

  const pick = (place: PlaceResult) => {
    onChange({
      lat: place.center[1],
      lng: place.center[0],
      label: place.name,
      address: place.address,
    });
    setInput(place.name);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        id={inputId}
        aria-label={label ?? placeholder}
        icon={<MapPin className="h-4 w-4" />}
        placeholder={placeholder}
        value={input}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false);
          if (event.key === 'Enter' && results[0]) {
            // Enter takes the top hit rather than submitting a form with a
            // typed string that was never resolved to coordinates.
            event.preventDefault();
            pick(results[0]);
          }
        }}
        onChange={(event) => {
          setInput(event.target.value);
          setOpen(true);
          // Editing invalidates the resolved place: the text no longer
          // describes the coordinates we are holding.
          if (value) onChange(null);
        }}
      />

      {showList && anchor && typeof document !== 'undefined'
        ? createPortal(
            <ul
              ref={listRef}
              style={{
                position: 'fixed',
                top: anchor.top,
                left: anchor.left,
                width: anchor.width,
              }}
              className="z-[60] overflow-hidden rounded-lg border border-line bg-surface shadow-float"
            >
              {results.map((place) => (
                <li key={place.id}>
                  <button
                    type="button"
                    // Selection happens on mousedown, and the default is
                    // prevented so the input never blurs first. The old
                    // blur-then-150ms-timeout dance dropped the click often
                    // enough that a place could look picked and not be, which
                    // left "Post ride" disabled with nothing explaining why.
                    onMouseDown={(event) => {
                      event.preventDefault();
                      pick(place);
                    }}
                    className={cn(
                      'flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left',
                      'transition-colors hover:bg-surface-sunken',
                    )}
                  >
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-subtle" />
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-medium text-ink">
                        {place.name}
                      </span>
                      {place.address ? (
                        <span className="block truncate text-[12px] text-ink-muted">
                          {place.address}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}
