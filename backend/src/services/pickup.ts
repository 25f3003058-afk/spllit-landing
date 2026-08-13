/**
 * Can a driver actually get to this pin?
 *
 * A geocoder answers "where is this place". Nothing in it answers "where can a
 * car stop", and for a ride-sharing app those come apart exactly where it matters
 * most: the middle of a campus, a mall, a station forecourt, a hospital block.
 * The centroid of a large POI is a fine answer to the first question and can be
 * two hundred metres of footpath away from the answer to the second.
 *
 * So this looks up the nearest drivable road and reports the distance. It does
 * not move anything — see `lib/pickup-advice` for what is done with the number,
 * and why nothing is ever snapped without being offered first.
 *
 * Server-side for the same two reasons as Directions: the secret token stays
 * here, and one cached answer serves every member of a squad looking at the same
 * meeting point instead of each of them spending a request on it.
 */

const TOKEN = process.env.MAPBOX_SECRET_TOKEN ?? process.env.MAPBOX_TOKEN ?? '';

export type RoadSnap =
  | {
      status: 'ok';
      point: [number, number];
      distanceMetres: number;
      roadClass: string;
    }
  | { status: 'no-road' }
  | { status: 'unavailable' };

/**
 * Mapbox Tilequery, not Directions or Map Matching.
 *
 * Both of those want at least two coordinates and answer a question about a
 * journey. This is a question about one point, and Tilequery is the endpoint that
 * takes one: given a position it returns nearby features from the road layer,
 * each with `tilequery.distance` in metres and — usefully — a Point geometry at
 * the closest position on the feature, so the kerbside coordinate comes back
 * directly rather than having to be projected onto a line here.
 */
const TILESET = 'mapbox.mapbox-streets-v8';

/**
 * Road classes a car can use.
 *
 * `service` is in: on a campus or behind a mall the service road genuinely is the
 * way in, and excluding it would report "no road" for places that plainly have
 * one. `path`, `pedestrian`, `steps`, `track` and the rail classes are out — a
 * footbridge 20 m away is not a pickup point, and treating it as one would put a
 * driver on the wrong side of a wall.
 */
const DRIVABLE = new Set([
  'motorway',
  'motorway_link',
  'trunk',
  'trunk_link',
  'primary',
  'primary_link',
  'secondary',
  'secondary_link',
  'tertiary',
  'tertiary_link',
  'street',
  'street_limited',
  'residential',
  'living_street',
  'service',
]);

/**
 * How far to look.
 *
 * Wider than the distance at which a suggestion is ever offered (150 m), on
 * purpose: past that point the useful answer stops being "here is the kerb" and
 * becomes "the nearest road is 300 m away", and that sentence needs the number.
 */
const SEARCH_RADIUS_METRES = 400;

interface CacheEntry {
  snap: RoadSnap;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Ten minutes. Roads do not move, so this could be far longer; it is kept short
 * enough that a corrected tile reaches users the same day, and the key is fine
 * enough that the cache is per-pin rather than per-area.
 */
const TTL_MS = 10 * 60_000;

/** ~11 m at Indian latitudes — finer than the 30 m "already kerbside" test. */
function key(lng: number, lat: number): string {
  return `${lng.toFixed(4)},${lat.toFixed(4)}`;
}

export function isPickupConfigured(): boolean {
  return Boolean(TOKEN);
}

export async function nearestRoad(lng: number, lat: number): Promise<RoadSnap> {
  if (!TOKEN) return { status: 'unavailable' };

  const cacheKey = key(lng, lat);
  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) return hit.snap;

  const remember = (snap: RoadSnap): RoadSnap => {
    // An outage is not cached: it says nothing about the place, and the next
    // request should ask again rather than inherit a failure for ten minutes.
    if (snap.status !== 'unavailable') {
      cache.set(cacheKey, { snap, expiresAt: Date.now() + TTL_MS });
    }
    return snap;
  };

  try {
    const url = new URL(`https://api.mapbox.com/v4/${TILESET}/tilequery/${lng},${lat}.json`);
    url.searchParams.set('access_token', TOKEN);
    url.searchParams.set('radius', String(SEARCH_RADIUS_METRES));
    url.searchParams.set('layers', 'road');
    // Enough to get past a footpath or two that happen to be nearer than the
    // road; `dedupe` keeps repeated segments of the same way out of that count.
    url.searchParams.set('limit', '25');
    url.searchParams.set('dedupe', 'true');

    const response = await fetch(url.toString());
    if (!response.ok) {
      console.error('[pickup] tilequery', response.status);
      return remember({ status: 'unavailable' });
    }

    const payload = (await response.json()) as {
      features?: {
        geometry?: { type?: string; coordinates?: number[] };
        properties?: { class?: string; tilequery?: { distance?: number } };
      }[];
    };

    let best: { point: [number, number]; distanceMetres: number; roadClass: string } | null = null;

    for (const feature of payload.features ?? []) {
      const roadClass = feature.properties?.class;
      const distance = feature.properties?.tilequery?.distance;
      const coordinates = feature.geometry?.coordinates;

      if (!roadClass || !DRIVABLE.has(roadClass)) continue;
      if (typeof distance !== 'number' || !Number.isFinite(distance)) continue;
      // Only a Point carries a usable kerbside coordinate. A clipped LineString
      // would need projecting, and Tilequery returns Points for this query.
      if (feature.geometry?.type !== 'Point') continue;
      if (typeof coordinates?.[0] !== 'number' || typeof coordinates[1] !== 'number') continue;

      if (!best || distance < best.distanceMetres) {
        best = {
          point: [coordinates[0], coordinates[1]],
          distanceMetres: distance,
          roadClass,
        };
      }
    }

    if (!best) return remember({ status: 'no-road' });

    return remember({
      status: 'ok',
      point: best.point,
      distanceMetres: Math.round(best.distanceMetres),
      roadClass: best.roadClass,
    });
  } catch (error) {
    console.error('[pickup]', error);
    return { status: 'unavailable' };
  }
}

/** Drops expired entries so the cache cannot grow without bound. */
setInterval(() => {
  const now = Date.now();
  for (const [k, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(k);
  }
}, 60_000).unref();
