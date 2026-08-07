/**
 * Route-corridor geometry.
 *
 * The matching rule: a guest fits a host's trip when both their pickup and
 * their drop-off lie within a buffer of the host's path, *and* the pickup
 * comes first along that path. The ordering check is what stops someone
 * travelling the opposite way down the same road being offered as a match —
 * proximity alone would rank them perfectly.
 *
 * Everything is done in a local planar frame rather than with repeated
 * haversine calls. Point-to-segment distance has no closed form on a sphere,
 * and at city scale an equirectangular projection about the path's own
 * latitude is accurate to well under a metre — far inside the ~1.5 km buffer
 * this feeds.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface CorridorFit {
  /** Metres from the guest's pickup to the nearest point on the host's path. */
  pickupDetourMetres: number;
  dropoffDetourMetres: number;
  /** Metres travelled along the path before each point, for ordering. */
  pickupAlongMetres: number;
  dropoffAlongMetres: number;
  /** Length of the host's path. */
  pathMetres: number;
}

const METRES_PER_DEGREE_LAT = 111_320;

interface PlanePoint {
  x: number;
  y: number;
}

/**
 * Converts degrees to metres about a reference latitude. Longitude degrees
 * shrink with the cosine of latitude; using a fixed scale would stretch
 * east-west distances by ~3% at Chennai and much more further north.
 */
function planeFactory(referenceLat: number) {
  const lngScale = METRES_PER_DEGREE_LAT * Math.cos((referenceLat * Math.PI) / 180);
  return (point: LatLng): PlanePoint => ({
    x: point.lng * lngScale,
    y: point.lat * METRES_PER_DEGREE_LAT,
  });
}

interface Projection {
  /** Perpendicular distance from the point to the segment, in metres. */
  distance: number;
  /** Distance along the segment to the closest point, in metres. */
  along: number;
}

function projectOntoSegment(p: PlanePoint, a: PlanePoint, b: PlanePoint): Projection {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;

  // Degenerate segment (duplicate consecutive coordinates are common in
  // simplified polylines) — fall back to point distance.
  if (lengthSq === 0) {
    return { distance: Math.hypot(p.x - a.x, p.y - a.y), along: 0 };
  }

  // Clamped so the closest point never runs off the end of the segment; the
  // caller walks every segment, so the true nearest point is always found on
  // one of them.
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq));
  const closestX = a.x + t * dx;
  const closestY = a.y + t * dy;

  return {
    distance: Math.hypot(p.x - closestX, p.y - closestY),
    along: t * Math.sqrt(lengthSq),
  };
}

interface NearestOnPath {
  distance: number;
  /** Cumulative metres from the start of the path. */
  along: number;
}

function nearestOnPath(point: PlanePoint, path: PlanePoint[]): NearestOnPath {
  let best: NearestOnPath = { distance: Infinity, along: 0 };
  let travelled = 0;

  for (let i = 0; i < path.length - 1; i += 1) {
    const a = path[i] as PlanePoint;
    const b = path[i + 1] as PlanePoint;
    const projection = projectOntoSegment(point, a, b);

    if (projection.distance < best.distance) {
      best = { distance: projection.distance, along: travelled + projection.along };
    }
    travelled += Math.hypot(b.x - a.x, b.y - a.y);
  }

  return best;
}

/**
 * Measures a guest's pickup and drop-off against a host's path.
 *
 * `path` is the host's route — the real Directions polyline where one is
 * available, otherwise just [origin, …stops, destination]. Returns null for a
 * path too short to have a direction.
 */
export function fitToCorridor(
  path: LatLng[],
  pickup: LatLng,
  dropoff: LatLng,
): CorridorFit | null {
  if (path.length < 2) return null;

  const toPlane = planeFactory(path[0]!.lat);
  const planePath = path.map(toPlane);

  let pathMetres = 0;
  for (let i = 0; i < planePath.length - 1; i += 1) {
    const a = planePath[i] as PlanePoint;
    const b = planePath[i + 1] as PlanePoint;
    pathMetres += Math.hypot(b.x - a.x, b.y - a.y);
  }
  if (pathMetres === 0) return null;

  const pickupHit = nearestOnPath(toPlane(pickup), planePath);
  const dropoffHit = nearestOnPath(toPlane(dropoff), planePath);

  return {
    pickupDetourMetres: pickupHit.distance,
    dropoffDetourMetres: dropoffHit.distance,
    pickupAlongMetres: pickupHit.along,
    dropoffAlongMetres: dropoffHit.along,
    pathMetres,
  };
}

export interface CorridorRule {
  /** Maximum perpendicular distance from the path, in metres. */
  bufferMetres: number;
  /**
   * How much of the host's trip the guest must actually share. Guards against
   * a match whose pickup and drop-off project onto nearly the same point —
   * geometrically inside the corridor, but not a shared journey.
   */
  minSharedMetres: number;
}

export const DEFAULT_CORRIDOR: CorridorRule = {
  bufferMetres: 1_500,
  minSharedMetres: 500,
};

/** Whether a fit is an actual match, and how good. */
export function scoreFit(
  fit: CorridorFit,
  rule: CorridorRule = DEFAULT_CORRIDOR,
): { matches: boolean; sharedMetres: number; detourMetres: number } {
  const sharedMetres = fit.dropoffAlongMetres - fit.pickupAlongMetres;
  const detourMetres = fit.pickupDetourMetres + fit.dropoffDetourMetres;

  const matches =
    fit.pickupDetourMetres <= rule.bufferMetres &&
    fit.dropoffDetourMetres <= rule.bufferMetres &&
    // Positive means the guest is picked up before being dropped off, i.e.
    // travelling the same way down the corridor rather than against it.
    sharedMetres >= rule.minSharedMetres;

  return { matches, sharedMetres, detourMetres };
}
