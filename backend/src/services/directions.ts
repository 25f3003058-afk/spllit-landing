/**
 * Mapbox Directions, server-side.
 *
 * ETA and distance are computed here rather than on the client for two reasons:
 * the secret token never leaves the server, and one cached result serves every
 * viewer of a ride instead of each of them burning a Directions request on
 * every render.
 */

const TOKEN = process.env.MAPBOX_SECRET_TOKEN ?? process.env.MAPBOX_TOKEN ?? '';

export interface Route {
  distanceMetres: number;
  durationSeconds: number;
  /** [lng, lat] pairs for the map's route line layer. */
  coordinates: [number, number][];
}

interface CacheEntry {
  route: Route | null;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * 30 s. Long enough that a busy ride page does not re-request per viewer,
 * short enough that a moving driver's ETA still feels live.
 */
const TTL_MS = 30_000;

/** Cache key snaps to ~50 m so tiny GPS jitter doesn't miss the cache. */
function key(from: [number, number], to: [number, number], profile: string): string {
  const snap = (n: number) => n.toFixed(3);
  return `${profile}:${snap(from[0])},${snap(from[1])}->${snap(to[0])},${snap(to[1])}`;
}

export function isDirectionsConfigured(): boolean {
  return Boolean(TOKEN);
}

export async function getRoute(
  from: [number, number],
  to: [number, number],
  profile: 'driving' | 'driving-traffic' | 'walking' | 'cycling' = 'driving-traffic',
): Promise<Route | null> {
  if (!TOKEN) return null;

  const cacheKey = key(from, to, profile);
  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) return hit.route;

  try {
    const url = new URL(
      `https://api.mapbox.com/directions/v5/mapbox/${profile}/` +
        `${from[0]},${from[1]};${to[0]},${to[1]}`,
    );
    url.searchParams.set('access_token', TOKEN);
    url.searchParams.set('geometries', 'geojson');
    url.searchParams.set('overview', 'simplified');

    const response = await fetch(url.toString());
    if (!response.ok) {
      cache.set(cacheKey, { route: null, expiresAt: Date.now() + TTL_MS });
      return null;
    }

    const payload = (await response.json()) as {
      routes?: {
        distance: number;
        duration: number;
        geometry: { coordinates: [number, number][] };
      }[];
    };

    const first = payload.routes?.[0];
    const route: Route | null = first
      ? {
          distanceMetres: first.distance,
          durationSeconds: first.duration,
          coordinates: first.geometry.coordinates,
        }
      : null;

    cache.set(cacheKey, { route, expiresAt: Date.now() + TTL_MS });
    return route;
  } catch (error) {
    console.error('[directions]', error);
    return null;
  }
}

/** Drops expired entries so the cache cannot grow without bound. */
setInterval(() => {
  const now = Date.now();
  for (const [k, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(k);
  }
}, 60_000).unref();
