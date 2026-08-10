'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';

import { cn, formatDistance, haversine } from '@/lib/utils';
import { config } from '@/lib/config';
import { useClickOutside } from '@/lib/hooks/use-click-outside';
import { comparePlaces, featurePrecision } from '@/lib/place-ranking';
import {
  describeFeature,
  parseSearchBoxFeature,
  type GeocodeFeature,
  type SearchBoxFeature,
} from '@/lib/place-feature';
import { Input } from '@/components/ui/input';
import type { LngLat, PlaceResult } from '@/types';

/**
 * Place search, against Mapbox's Search Box API.
 *
 * Not the Geocoding API, which is what this used to call and which is the
 * reason results looked like an atlas rather than a destination picker.
 * Geocoding v5 carries almost no POI data for India: "IIT Madras Research Park"
 * against it returns "Road to IIT Madras Research Park Gate", three unrelated
 * roads with "Madras" in the name and the city of Chennai, and no combination
 * of `types`, `proximity` or `bbox` improves that, because the building is not
 * in the index to be found. The same query against Search Box returns "IIT
 * Madras Research Park Block C". Ranking cannot promote a result that was never
 * returned, so the index had to change first.
 *
 * `/forward` rather than `/suggest` + `/retrieve`: the two-step flow exists to
 * defer resolving coordinates until a selection is made, and it needs a session
 * token to do it. `/forward` answers with full features — coordinates included
 * — in one request, which is what a list that has to show distances needs, and
 * it keeps the picker's shape exactly as it was.
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
  precision: number;
}

async function request(query: string, near: LngLat, local: boolean): Promise<Candidate[]> {
  const url = new URL('https://api.mapbox.com/search/searchbox/v1/forward');
  url.searchParams.set('q', query);
  url.searchParams.set('access_token', config.mapbox.token);
  // 10 is the API maximum. At 5, a city with several branches of the same name
  // returned a couple of them and silently dropped the rest.
  url.searchParams.set('limit', '10');
  url.searchParams.set('country', 'IN');
  // Without this Mapbox answers in the feature's own local language, so a
  // Chennai search typed in Latin script comes back partly in Tamil script and
  // matches nothing the user can read back against what they typed.
  url.searchParams.set('language', 'en');
  url.searchParams.set('proximity', `${near[0]},${near[1]}`);

  if (local) {
    const [lng, lat] = near;
    url.searchParams.set(
      'bbox',
      [lng - LOCAL_DEGREES, lat - LOCAL_DEGREES, lng + LOCAL_DEGREES, lat + LOCAL_DEGREES]
        .map((value) => value.toFixed(4))
        .join(','),
    );
  }

  const response = await fetch(url.toString());
  if (!response.ok) return [];
  const payload = (await response.json()) as { features?: SearchBoxFeature[] };
  const features = payload.features ?? [];

  return features.flatMap((feature, index) => {
    const parsed = parseSearchBoxFeature(feature);
    if (!parsed) return [];
    return [
      {
        id: parsed.id,
        name: parsed.name,
        address: parsed.address,
        // Exactly what Mapbox returned for this feature, carried through to
        // `pick` untouched. Nothing downstream substitutes a city or a
        // locality centroid for it.
        center: parsed.center,
        /**
         * Search Box scores results by ordering them rather than by returning
         * a number, so position is the only confidence signal there is. It is
         * normalised so the two passes are comparable, and it is only ever a
         * late tiebreak — see `comparePlaces`.
         */
        relevance: (features.length - index) / features.length,
        distanceKm: haversine(near, parsed.center) / 1000,
        precision: featurePrecision(parsed.featureType),
      },
    ];
  });
}

/**
 * A real answer first, a real place second, nearest third.
 *
 * Two passes run together and are merged. The bounded pass earns its place
 * because proximity only *biases* Mapbox, so without a box a well-known distant
 * match can bury a local one. It is a source of candidates, never a gate on the
 * other request — an earlier version returned early whenever the bounded pass
 * was non-empty, which hid all four genuine Fortune Towers behind five wrong
 * buildings that happened to be closer.
 *
 * The reference point is whatever the caller passes: the trip's origin where
 * one has been chosen, otherwise the device position, otherwise the configured
 * default city. It is never a hardcoded location.
 */
async function geocode(query: string, proximity?: LngLat | null): Promise<Candidate[]> {
  if (!config.mapbox.token) return [];

  const near: LngLat = proximity ?? [config.defaultLocation.lng, config.defaultLocation.lat];

  const passes = await Promise.all([request(query, near, true), request(query, near, false)]);

  const merged = new Map<string, Candidate>();
  for (const item of passes.flat()) {
    const existing = merged.get(item.id);
    // Same feature can arrive from both passes; keep the better-scored copy.
    if (!existing || item.relevance > existing.relevance) merged.set(item.id, item);
  }

  return [...merged.values()].sort(comparePlaces<Candidate>(query)).slice(0, 12);
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
 * Stays on Geocoding v5 while search has moved to Search Box, because for this
 * direction v5 is the better index: asked about a point inside the IIT Madras
 * campus, Search Box `/reverse` answers "Way inside IITM RP" with no address at
 * all, where v5 gives a street. Search wants the POI table; a pin wants the
 * address table.
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
    url.searchParams.set('language', 'en');
    // Street-level types only: a pin dropped on a road should not come back
    // named after the district it happens to sit in.
    url.searchParams.set('types', 'address,poi,neighborhood,place');

    const response = await fetch(url.toString());
    if (!response.ok) return fallback;

    const payload = (await response.json()) as { features?: GeocodeFeature[] };
    const feature = payload.features?.[0];
    if (!feature) return fallback;

    const { name, address } = describeFeature(feature);
    return {
      lat: point[1],
      lng: point[0],
      label: name || fallback.label,
      /**
       * `place_name` is kept as the backstop rather than dropped.
       * `/location` reads a null address as "Mapbox could not identify this
       * pin", and a feature that came back named but with nothing left to say
       * about where it is has been identified — it must not be reported as an
       * unnamed patch of road.
       */
      address: address ?? feature.place_name ?? null,
    };
  } catch {
    return fallback;
  }
}

interface Anchor {
  top: number;
  left: number;
  width: number;
  /** Clamped so the list can never run off the top or bottom of the screen. */
  maxHeight: number;
}

/** Breathing room between the list and the viewport edge. */
const VIEWPORT_GUTTER = 12;
/** Below this the list flips above the input instead of being squashed. */
const MIN_BELOW = 180;

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
   * Which suggestion the keyboard is on. -1 means none, and that is the
   * starting value on purpose: Enter used to select `results[0]` outright, so
   * typing "fortune tower" and pressing Enter silently picked whatever Mapbox
   * happened to rank first — which could be a building 1,600km away. A
   * destination is now only ever chosen by an explicit tap or an explicit
   * arrow-key selection.
   */
  const [active, setActive] = useState(-1);

  /**
   * Clamped on read rather than reset from an effect.
   *
   * A slow query can deliver a shorter list while a highlight is sitting past
   * its end, and resetting that in an effect would be a second render pass for
   * something already knowable during the first. Typing resets the highlight at
   * source, and results only ever change as a consequence of typing, so this
   * clamp is the only other case there is.
   */
  const activeIndex = active >= 0 && active < results.length ? active : -1;

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

      /**
       * The list is measured against the viewport and clamped, rather than
       * being allowed to size to its content.
       *
       * Ten results at ~56px each is ~560px — taller than a 320×568 phone
       * screen. Anchored under an input halfway down the page it ran off the
       * bottom, and the results below the fold could not be reached because the
       * list is `position: fixed` and does not scroll with the page.
       */
      const below = window.innerHeight - rect.bottom - VIEWPORT_GUTTER - 4;
      const above = rect.top - VIEWPORT_GUTTER - 4;

      // Flip above the field only when below is genuinely too cramped *and*
      // there is more room up there — on a short screen both can be tight.
      const flip = below < MIN_BELOW && above > below;

      setAnchor({
        top: flip ? Math.max(VIEWPORT_GUTTER, rect.top - 4 - Math.min(above, 420)) : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(120, Math.min(flip ? above : below, 420)),
      });
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
        role="combobox"
        aria-expanded={showList}
        aria-controls={showList ? `${inputId}-listbox` : undefined}
        aria-activedescendant={
          activeIndex >= 0 ? `${inputId}-option-${activeIndex}` : undefined
        }
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setOpen(false);
            setActive(-1);
            return;
          }
          if (!showList) return;

          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActive((i) => (i + 1) % results.length);
            return;
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
            return;
          }
          if (event.key === 'Enter') {
            /**
             * Only a deliberately highlighted result is taken. Enter on an
             * un-navigated list does nothing rather than guessing — see the
             * note on `active`.
             */
            const chosen = activeIndex >= 0 ? results[activeIndex] : undefined;
            if (chosen) {
              event.preventDefault();
              pick(chosen);
            }
          }
        }}
        onChange={(event) => {
          setInput(event.target.value);
          setOpen(true);
          setActive(-1);
          // Editing invalidates the resolved place: the text no longer
          // describes the coordinates we are holding.
          if (value) onChange(null);
        }}
      />

      {showList && anchor && typeof document !== 'undefined'
        ? createPortal(
            <ul
              ref={listRef}
              id={`${inputId}-listbox`}
              role="listbox"
              style={{
                position: 'fixed',
                top: anchor.top,
                left: anchor.left,
                width: anchor.width,
                maxHeight: anchor.maxHeight,
              }}
              className="z-[60] overflow-y-auto overscroll-contain rounded-lg border border-line bg-surface shadow-float"
            >
              {results.map((place, index) => (
                <li key={place.id}>
                  <button
                    type="button"
                    /**
                     * pointerdown, not mousedown.
                     *
                     * Selecting before blur is still the point — the old
                     * blur-then-timeout dance dropped clicks and left a place
                     * looking picked when it was not. But `mousedown` is a
                     * *synthesised* event on touch: the browser emits it only
                     * after it has decided the gesture was a tap and not a
                     * scroll, and on a list inside a scrollable sheet it
                     * frequently decides scroll and emits nothing at all. The
                     * suggestion highlighted and the field stayed empty.
                     *
                     * pointerdown fires immediately for touch, pen and mouse
                     * alike, before any scroll arbitration, so the tap always
                     * lands.
                     */
                    id={`${inputId}-option-${index}`}
                    role="option"
                    aria-selected={activeIndex === index}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      pick(place);
                    }}
                    className={cn(
                      // min-h keeps every row a 44px touch target even when the
                      // place has no address line to give it height.
                      'flex min-h-[52px] w-full items-start gap-2.5 px-3.5 py-2.5 text-left',
                      'transition-colors hover:bg-surface-sunken',
                      activeIndex === index && 'bg-surface-sunken',
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
                      // whitespace-nowrap as well as shrink-0: at 320px the
                      // column is narrow enough that "1.2 km" would otherwise
                      // break after the number and take the row to two lines.
                      <span className="mt-0.5 shrink-0 whitespace-nowrap text-[11.5px] tabular-nums text-ink-subtle">
                        {formatDistance(place.distanceKm * 1000)}
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
