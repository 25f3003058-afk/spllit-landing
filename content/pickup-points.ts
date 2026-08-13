/**
 * Spllit's own verified pickup points.
 *
 * Deliberately empty.
 *
 * A geocoder knows where a campus is. It does not know that the gate on Sardar
 * Patel Road is the one an auto can actually wait at, that the other one is
 * exit-only after ten, or which of the two hostel blocks people mean by "the
 * back gate". That knowledge exists only in the people using the app, and this
 * is where it will live when it has been collected.
 *
 * What matters now is that adding it later cannot mean rewriting the picker, so
 * the merge is wired and tested and the table starts empty. Provider search is
 * not gated on it: with no entries, `matchPickupPoints` returns nothing and the
 * picker behaves exactly as it does today.
 *
 * The bar for an entry is a coordinate somebody has stood on. Nothing in here
 * may be inferred from a map, a satellite image or a guess at where a gate
 * probably is — a verified pickup point that is wrong is worse than no verified
 * pickup point at all, because it ranks above everything Mapbox returns and
 * because the person waiting at it has no way to tell it was invented.
 */

import type { LngLat } from '@/types';

export interface VerifiedPickupPoint {
  /** Stable, `spllit:`-prefixed so it can never collide with a `mapbox_id`. */
  id: string;
  /** What people call it, e.g. "IIT Madras Gate 1". */
  name: string;
  /** The line under the name — usually the campus or building it belongs to. */
  address: string | null;
  /** Where a driver actually waits. Stood on, not inferred. */
  center: LngLat;
  /** Other things people call it, matched as well as the name. */
  aliases?: string[];
}

export const PICKUP_POINTS: VerifiedPickupPoint[] = [];

/** Query words all present in the name, an alias, or the address. */
function matches(query: string, point: VerifiedPickupPoint): boolean {
  const haystack = [point.name, point.address ?? '', ...(point.aliases ?? [])]
    .join(' ')
    .toLowerCase();
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return words.length > 0 && words.every((word) => haystack.includes(word));
}

/**
 * Verified points matching a query.
 *
 * Takes the table as an argument so the matching can be tested over fixtures
 * without the shipped list having to contain anything.
 */
export function matchPickupPoints(
  query: string,
  points: VerifiedPickupPoint[] = PICKUP_POINTS,
): VerifiedPickupPoint[] {
  if (points.length === 0) return [];
  return points.filter((point) => matches(query, point));
}
