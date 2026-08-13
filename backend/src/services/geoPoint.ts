/**
 * Writing an embedded GeoPoint without losing what is already in it.
 *
 * This exists because of how Prisma treats a composite field on MongoDB:
 * assigning one **replaces the entire embedded document**. There is no partial
 * update. So a handler that builds `{ lat, lng, label }` and assigns it does not
 * update three fields — it overwrites the whole point, silently discarding every
 * field it did not mention.
 *
 * That was already happening. `PATCH /:id/meeting-point` wrote exactly that
 * shape, so moving a meeting point erased the address that had been resolved for
 * it, and nothing anywhere said so. With `featureType`, `roadDistanceMetres`,
 * `source` and `accuracyMetres` on the same composite, the same line would have
 * thrown all four away too.
 *
 * Pure and dependency-free so the rules can be checked directly, which is the
 * only way to be sure about a bug whose whole nature is being invisible.
 */

/** The stored shape, exactly as Prisma expects it: nulls, never undefined. */
export interface StoredGeoPoint {
  lat: number;
  lng: number;
  label: string | null;
  address: string | null;
  featureType: string | null;
  roadDistanceMetres: number | null;
  source: string | null;
  accuracyMetres: number | null;
}

/** What a validated request body can offer. Absent is not the same as null. */
export interface GeoPointPatch {
  lat: number;
  lng: number;
  label?: string | null | undefined;
  address?: string | null | undefined;
  featureType?: string | null | undefined;
  roadDistanceMetres?: number | null | undefined;
  source?: string | null | undefined;
  accuracyMetres?: number | null | undefined;
}

/**
 * Below this, two coordinates are the same place.
 *
 * ~1 cm. Exact float equality would be wrong here — the same point makes a round
 * trip through JSON and a six-decimal URL — while anything larger would start
 * treating a genuine small move as a non-move and carry stale metadata onto it.
 */
const SAME_POINT_DEGREES = 1e-7;

function samePoint(a: { lat: number; lng: number }, b: { lat: number; lng: number }): boolean {
  return (
    Math.abs(a.lat - b.lat) < SAME_POINT_DEGREES && Math.abs(a.lng - b.lng) < SAME_POINT_DEGREES
  );
}

/**
 * Accuracy belongs to a measurement, so it cannot outlive one.
 *
 * A device fix that the user then drags to the kerb is no longer a device fix,
 * and keeping its accuracy figure would attach a measurement error to a
 * coordinate nobody measured. Enforced here rather than trusted from the client,
 * because it is an invariant of the data and not a detail of one caller.
 */
function accuracyFor(source: string | null, accuracyMetres: number | null): number | null {
  return source === 'device' ? accuracyMetres : null;
}

/** A validated point, normalised for storage. Nothing is inferred or invented. */
export function toStoredGeoPoint(point: GeoPointPatch): StoredGeoPoint {
  const source = point.source ?? null;
  return {
    lat: Number(point.lat),
    lng: Number(point.lng),
    label: point.label ?? null,
    address: point.address ?? null,
    featureType: point.featureType ?? null,
    roadDistanceMetres: point.roadDistanceMetres ?? null,
    source,
    accuracyMetres: accuracyFor(source, point.accuracyMetres ?? null),
  };
}

/**
 * The point to store when a meeting point is updated.
 *
 * Two rules, and the second is the one that matters.
 *
 * A field the request supplies always wins — that is what an update is. A field
 * it omits is inherited from what is already stored **only if the coordinate has
 * not moved**. Inheriting across a move would be worse than erasing: the address,
 * the feature type and the road distance all describe where the pin *was*, and
 * carrying them onto a new coordinate would state, with apparent authority, that
 * a different place is 12 m from a road and called something it is not.
 *
 * So an old client that sends only a new lat/lng gets a clean point rather than a
 * quietly wrong one, and a client that sends the whole point gets exactly what it
 * sent. Neither can lose data that still applies.
 */
export function mergeMeetingPoint(
  existing: Partial<StoredGeoPoint> | null | undefined,
  incoming: GeoPointPatch,
): StoredGeoPoint {
  const inherits = Boolean(existing) && samePoint(existing as StoredGeoPoint, incoming);

  const pick = <K extends keyof StoredGeoPoint>(key: K): StoredGeoPoint[K] | null => {
    const offered = incoming[key as keyof GeoPointPatch];
    if (offered !== undefined) return offered as StoredGeoPoint[K];
    return inherits ? ((existing?.[key] ?? null) as StoredGeoPoint[K]) : null;
  };

  const source = pick('source');

  return {
    lat: Number(incoming.lat),
    lng: Number(incoming.lng),
    label: pick('label'),
    address: pick('address'),
    featureType: pick('featureType'),
    roadDistanceMetres: pick('roadDistanceMetres'),
    source,
    accuracyMetres: accuracyFor(source, pick('accuracyMetres')),
  };
}
