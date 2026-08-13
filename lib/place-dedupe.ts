/**
 * Dropping results that are the same place listed twice.
 *
 * Pure and dependency-free, for the same reason `place-ranking` and
 * `place-feature` are: it has a right and a wrong answer over a fixed list, and
 * that is worth checking without a browser or a network.
 *
 * Mapbox genuinely returns duplicates, with distinct `mapbox_id`s, so merging by
 * id is not enough. Measured against the live Search Box index from Chennai:
 *
 *   "IIT Madras"       → "IIT Madras Campus" twice, 80.24191 and 80.24190
 *   "Velachery"        → "Velachery" twice at the same coordinates
 *   "Chennai Central"  → "Chennai Central" twice, ~28 m apart
 *   "Phoenix Mall"     → "Phoenix Market City Mall" twice
 *
 * Each pair costs a row in a list that is capped at twelve and read on a phone.
 */

import type { LngLat } from '@/types';

export interface DedupablePlace {
  name: string;
  center: LngLat;
}

/**
 * How close two same-named results have to be to be the same place.
 *
 * 40 m keeps the measured duplicates above — the widest is ~28 m — and still
 * separates the things that only look like duplicates: "Chennai Central" also
 * comes back for Station Road, 500 m from the Kannappar Thidal entrance, and
 * those are two genuinely different places to stand and wait.
 */
const SAME_PLACE_METRES = 40;

/**
 * Metres between two points, flat-earth.
 *
 * Deliberately not `haversine` from `lib/utils`: that module also exports `cn`
 * and pulls in clsx and tailwind-merge, and these place modules are kept
 * import-free so `node --test` can run them without a bundler or a path-alias
 * resolver. Over the tens of metres this compares, the flat approximation and
 * the great-circle answer differ by far less than the threshold.
 */
function metresBetween(a: LngLat, b: LngLat): number {
  const METRES_PER_DEGREE = 111_320;
  const midLat = ((a[1] + b[1]) / 2) * (Math.PI / 180);
  const x = (b[0] - a[0]) * Math.cos(midLat) * METRES_PER_DEGREE;
  const y = (b[1] - a[1]) * METRES_PER_DEGREE;
  return Math.sqrt(x * x + y * y);
}

/**
 * How close two results have to be for one name being a fuller version of the
 * other to mean they are the same venue.
 *
 * Wider than `SAME_PLACE_METRES` because these are not identical strings and the
 * two records are usually pinned to different parts of one large thing — a
 * station's concourse and its entrance, a mall and its car park. Measured on the
 * "Chennai Central" search: the station and "Chennai Central Railway Station" are
 * 136 m apart and are one destination.
 *
 * Deliberately tight enough to keep the things that only look alike. "Chennai
 * Central Suburban Terminal" is 315 m away and is a genuinely different platform
 * to be told to meet at, and the second "Chennai Central" on Station Road is 530 m
 * away and is the other side of the building. Both survive.
 */
const SAME_VENUE_METRES = 150;

/** Case, punctuation and spacing all vary between duplicate entries. */
function normalise(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Is one name simply a fuller way of saying the other?
 *
 * Word containment, not string containment: "Chennai Central" against "Chennai
 * Central Railway Station" is one destination described twice, and a picker that
 * spends its first five rows saying so is a worse picker than one that says it
 * once. Order-free, so it does not matter which of the pair was ranked higher.
 *
 * Note this is only ever consulted together with `SAME_VENUE_METRES`. On name
 * alone it would merge "Chennai Central" with a "Chennai Central" 500 m away, and
 * those are two different places to stand.
 */
function oneNameContainsTheOther(a: string, b: string): boolean {
  const first = new Set(normalise(a).split(' ').filter(Boolean));
  const second = new Set(normalise(b).split(' ').filter(Boolean));
  if (first.size === 0 || second.size === 0) return false;

  const [smaller, larger] = first.size <= second.size ? [first, second] : [second, first];
  for (const word of smaller) if (!larger.has(word)) return false;
  return true;
}

/**
 * Keeps the first of each duplicate group and drops the rest.
 *
 * Order-dependent on purpose: run it *after* ranking, so the copy that survives
 * is the one the comparator put highest rather than whichever Mapbox happened to
 * return first.
 *
 * Name equality is required as well as proximity. Proximity alone would collapse
 * a shop and the street corner outside it, which are 15 m apart and are not the
 * same answer to "where shall we meet".
 */
export function dedupePlaces<T extends DedupablePlace>(places: T[]): T[] {
  const kept: T[] = [];

  for (const place of places) {
    const key = normalise(place.name);
    const duplicate = kept.some((other) => {
      const metres = metresBetween(other.center, place.center);
      // Same name, same spot: the plain duplicate.
      if (normalise(other.name) === key && metres <= SAME_PLACE_METRES) return true;
      // One name a fuller version of the other, close enough to be one venue.
      return metres <= SAME_VENUE_METRES && oneNameContainsTheOther(other.name, place.name);
    });
    if (!duplicate) kept.push(place);
  }

  return kept;
}
