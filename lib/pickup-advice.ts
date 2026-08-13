/**
 * Turning "how far is the nearest road" into what to tell the user.
 *
 * The whole point of this module is that a searched place and a place a driver
 * can stop are not the same thing, and that the difference is *advice* rather
 * than a correction. Nothing here moves a pin. It decides which of four honest
 * sentences the confirmation card should say, and the user decides what to do
 * about it.
 *
 * Blind snapping is the failure this exists to avoid. A mall 200 m back from the
 * main road has service lanes, a car park and a footbridge around it; picking the
 * nearest line on the road layer and calling it the meeting point would move the
 * pin somewhere nobody agreed to, and would do it silently. So the nearest road
 * is only ever *offered*, and only within a range where "walk to the kerb" is
 * plainly what the user meant.
 *
 * Pure and dependency-free so the thresholds can be tested directly — see the
 * note at the top of `place-ranking`.
 */

import type { LngLat } from '@/types';

/**
 * How a coordinate came to be the coordinate.
 *
 * Worth recording because the four are not equally trustworthy and nothing about
 * the coordinate itself says which it was. A point somebody tapped is exact by
 * construction. A point from a device is only as good as the fix, and carries
 * `accuracyMetres` to say so. A suggested point is the one case where a pin sits
 * somewhere the user did not choose directly — they were offered it and accepted.
 *
 * Deliberately says nothing about roads. Whether a point is beside one is a fact
 * about the coordinate, measured by the road lookup below, and a tapped pin eight
 * metres from a kerb is just as roadside without anything having suggested it.
 * Mixing the two into one value would make each unable to express the other.
 *
 * Mirrors `GEO_SOURCES` in the backend validator, and lives here rather than
 * beside `PickedPlace` so the URL draft can check what it reads back without
 * importing a React component.
 */
export const GEO_SOURCES = ['search', 'manual', 'device', 'suggestion'] as const;

export type GeoSource = (typeof GEO_SOURCES)[number];

/** Narrows a value off a URL, which may be anything at all. */
export function isGeoSource(value: unknown): value is GeoSource {
  return (GEO_SOURCES as readonly unknown[]).includes(value);
}

/** What the server found. Mirrors the `/api/pickup` response exactly. */
export type RoadSnap =
  | {
      status: 'ok';
      /** Nearest point on a drivable road. */
      point: LngLat;
      distanceMetres: number;
      /** Mapbox Streets road class, e.g. `primary`, `street`, `service`. */
      roadClass: string;
    }
  /** Nothing drivable inside the search radius. */
  | { status: 'no-road' }
  /** Not configured, or the lookup failed. Never presented as a finding. */
  | { status: 'unavailable' };

export type PickupAdvice =
  /** Already beside a road. Nothing to offer. */
  | { kind: 'roadside'; roadClass: string }
  /** Close enough that walking to the kerb is obviously the intent. */
  | { kind: 'suggest'; point: LngLat; distanceMetres: number; roadClass: string }
  /** Too far in to guess. Say how far and leave the pin alone. */
  | { kind: 'far'; distanceMetres: number }
  | { kind: 'no-road' }
  /** Say nothing: an outage must not read as a fact about the place. */
  | { kind: 'unknown' };

/**
 * Inside this, the pin is already kerbside.
 *
 * 30 m is about the width of a road plus its verge, and comfortably inside the
 * error of a phone GPS fix, so anything closer cannot be meaningfully improved
 * by moving it.
 */
export const ROADSIDE_METRES = 30;

/**
 * Beyond this, no suggestion is offered at all.
 *
 * 150 m is roughly the point where "just outside" stops being true. Measured
 * against the live road layer, a pin dropped in the middle of the IIT Madras
 * campus is 22 m from a service road that is genuinely the way in, while the
 * centre of Phoenix Marketcity is 36 m from Velachery Main Road — both well
 * inside this. What falls outside it is the case where the nearest road is on
 * the far side of a wall, a railway line or a river, and that is exactly the
 * case where a suggestion would be worse than silence.
 */
export const SUGGEST_MAX_METRES = 150;

export function pickupAdvice(snap: RoadSnap): PickupAdvice {
  if (snap.status === 'unavailable') return { kind: 'unknown' };
  if (snap.status === 'no-road') return { kind: 'no-road' };

  if (snap.distanceMetres <= ROADSIDE_METRES) {
    return { kind: 'roadside', roadClass: snap.roadClass };
  }

  if (snap.distanceMetres <= SUGGEST_MAX_METRES) {
    return {
      kind: 'suggest',
      point: snap.point,
      distanceMetres: snap.distanceMetres,
      roadClass: snap.roadClass,
    };
  }

  return { kind: 'far', distanceMetres: snap.distanceMetres };
}
