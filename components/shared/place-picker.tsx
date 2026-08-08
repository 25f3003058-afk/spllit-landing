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
  /** Mapbox's 0–1 match quality. Central to ranking — see `geocode`. */
  relevance?: number;
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

interface Candidate extends PlaceResult {
  relevance: number;
  distanceKm: number;
}

/** Great-circle distance, for ranking and for the "x km away" hint. */
function distanceKm(a: LngLat, b: LngLat): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Short, glanceable: metres under a km, whole km after, no false precision. */
function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

async function request(query: string, proximity: LngLat, bbox: boolean): Promise<Candidate[]> {
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
  );
  url.searchParams.set('access_token', config.mapbox.token);
  // 10 is the API maximum. At 5, a city with several branches of the same name
  // returned a couple of them and silently dropped the rest.
  url.searchParams.set('limit', '10');
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
    relevance: typeof feature.relevance === 'number' ? feature.relevance : 0,
    distanceKm: distanceKm(proximity, feature.center),
  }));
}

/**
 * Place search: everything that matches, nearest first within equal quality.
 *
 * The previous version ran a city-bounded pass and returned early if it found
 * anything at all, falling back to a national search only on zero results. That
 * hid correct answers, and measurably so — searching "fortune tower" from
 * Velachery, the bounded pass returned five features, none of them a Fortune
 * Tower: P.R.P. Tower, Temple Tower, Vvr Towers, all scoring relevance 0.50 on
 * the word "tower" alone. Because that pass was non-empty, the four genuine
 * Fortune Towers — every one scoring 1.00 — were never requested. The user saw
 * five wrong buildings and concluded places were missing. They were.
 *
 * Both passes now run together and are merged. The bounded pass still earns its
 * place: proximity only *biases* Mapbox, so without a box a well-known distant
 * match can bury a local one. It is now a source of candidates rather than a
 * gate on the other request.
 *
 * Ranking is relevance first, then distance — not distance alone, which is the
 * tempting reading of "nearby first". Distance alone would have put those 0.50
 * "Tower" matches above every exact Fortune Tower, which is precisely the bug.
 *
 * Relevance is bucketed so near-identical scores tie and are settled by
 * distance. The bucket width is measured, not guessed: at 0.05, "phoenix mall"
 * ranked a 1.00 match in Mulshi (932km) above a 0.96 in Bengaluru (275km) — a
 * four-hundredths difference in spelling confidence outweighing 650km. At 0.1
 * those tie and the nearer one wins, while 0.50 stays firmly in its own bucket
 * below. Verified against the live API across local, chain-name and
 * long-distance queries.
 */
async function geocode(query: string, proximity?: LngLat | null): Promise<Candidate[]> {
  if (!config.mapbox.token) return [];

  const near: LngLat = proximity ?? [config.defaultLocation.lng, config.defaultLocation.lat];

  const [local, national] = await Promise.all([
    request(query, near, true),
    request(query, near, false),
  ]);

  const merged = new Map<string, Candidate>();
  for (const item of [...local, ...national]) {
    const existing = merged.get(item.id);
    // Same feature can arrive from both passes; keep the better-scored copy.
    if (!existing || item.relevance > existing.relevance) merged.set(item.id, item);
  }

  const bucket = (relevance: number) => Math.round(relevance / 0.1);

  return [...merged.values()]
    .sort((a, b) => {
      const byQuality = bucket(b.relevance) - bucket(a.relevance);
      if (byQuality !== 0) return byQuality;
      return a.distanceKm - b.distanceKm;
    })
    .slice(0, 12);
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
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium text-ink">
                        {place.name}
                      </span>
                      {place.address ? (
                        <span className="block truncate text-[12px] text-ink-muted">
                          {place.address}
                        </span>
                      ) : null}
                    </span>
                    {/*
                      Distance is not decoration now that results are no longer
                      confined to one city. Searching a chain name legitimately
                      returns the same building in four states, and the address
                      line truncates before the city is visible — so without
                      this the only way to tell a 2km match from a 1,600km one
                      is to pick it and look at the map.
                    */}
                    {typeof place.distanceKm === 'number' ? (
                      <span className="mt-0.5 shrink-0 text-[11.5px] tabular-nums text-ink-subtle">
                        {formatDistance(place.distanceKm)}
                      </span>
                    ) : null}
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
