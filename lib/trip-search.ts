import type { LngLat } from '@/types';

/**
 * The search a user is making, encoded in the URL.
 *
 * In the query string rather than a store so that a refresh, a shared link and
 * the browser Back button all reproduce the same results screen. The multi-step
 * flow previously kept every selection in one component's `useState`, so
 * navigating away lost it — which is exactly what the Back button is for.
 *
 * Only what is needed to re-run a public search lives here. Nothing private,
 * nothing about payment: a URL is copied, logged by proxies and pasted into
 * chats, so it may only ever carry things that are already public — a place
 * name and a pair of coordinates.
 */
export interface TripSearch {
  origin: LngLat | null;
  originLabel: string | null;
  destination: LngLat | null;
  destinationLabel: string | null;
  /** ISO departure. Absent means "now". */
  departAt: string | null;
}

export type TripTab = 'rides' | 'squads';

function num(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Reads a search back out of `useSearchParams()`. Tolerates anything. */
export function readTripSearch(params: URLSearchParams): TripSearch {
  const originLng = num(params.get('originLng'));
  const originLat = num(params.get('originLat'));
  const destLng = num(params.get('destLng'));
  const destLat = num(params.get('destLat'));

  return {
    origin: originLng !== null && originLat !== null ? [originLng, originLat] : null,
    originLabel: params.get('origin'),
    destination: destLng !== null && destLat !== null ? [destLng, destLat] : null,
    destinationLabel: params.get('dest'),
    departAt: params.get('at'),
  };
}

/**
 * Builds the query string for a search.
 *
 * Empty values are omitted rather than written as blanks, so the URL stays
 * readable and `readTripSearch` never has to distinguish "absent" from "empty".
 */
export function tripSearchParams(
  search: Partial<TripSearch> & { tab?: TripTab },
): URLSearchParams {
  const params = new URLSearchParams();

  if (search.origin) {
    params.set('originLng', search.origin[0].toFixed(6));
    params.set('originLat', search.origin[1].toFixed(6));
  }
  if (search.originLabel) params.set('origin', search.originLabel);
  if (search.destination) {
    params.set('destLng', search.destination[0].toFixed(6));
    params.set('destLat', search.destination[1].toFixed(6));
  }
  if (search.destinationLabel) params.set('dest', search.destinationLabel);
  if (search.departAt) params.set('at', search.departAt);
  if (search.tab) params.set('tab', search.tab);

  return params;
}

export function readTab(params: URLSearchParams): TripTab {
  return params.get('tab') === 'squads' ? 'squads' : 'rides';
}

/** First line of a Mapbox label — "Velachery, Chennai, …" is too long for a card. */
export function shortPlace(label: string | null | undefined): string {
  if (!label) return '';
  // `split` always yields at least one element, but noUncheckedIndexedAccess
  // types it as possibly undefined — so this is narrowed rather than asserted.
  const [first] = label.split(',');
  return (first ?? label).trim();
}
