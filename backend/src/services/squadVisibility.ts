/**
 * One definition of "can this person still join this squad".
 *
 * The sibling of rideVisibility, and here for the same reason: the rules were
 * about to be needed by three callers (nearby, availability, and the map feed)
 * and three copies is how /nearby and /search ended up disagreeing on the rides
 * side.
 *
 * Host-facing surfaces deliberately do not use this — a leader must still see
 * their own full squad, which is exactly what /squads/mine is for.
 */

/** A squad is discoverable only while it is genuinely open to strangers. */
export const OPEN_SQUAD_WHERE = {
  isActive: true,
  visibility: 'public',
  status: 'active',
} as const;

/**
 * How long a squad stays discoverable after the moment it was meeting at.
 *
 * Anchored to `meetingAt`, not `createdAt`, for the reason rides are anchored
 * to departure: a squad formed a week before a trip is legitimate and must not
 * expire for being old. What makes a listing stale is a meeting time that has
 * passed with nobody closing the squad out.
 *
 * Squads with no meeting time set are not expired by this — they are still
 * being planned, which is the state most squads sit in longest.
 */
export const STALE_AFTER_MEETING_HOURS = 5;

/** Grace after the meeting time, so a squad forming right now stays findable. */
export const MEETING_GRACE_MINUTES = 30;

export function staleMeetingCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - MEETING_GRACE_MINUTES * 60 * 1000);
}

/**
 * True when a squad has no room left.
 *
 * `memberLimit` is nullable and null means "no cap", so a null limit is never
 * full. `memberCount` is the denormalised counter maintained on join and leave,
 * which is what the list cards already read — using it here keeps the badge and
 * the filter from disagreeing.
 */
export function isFull(memberCount: number, memberLimit: number | null): boolean {
  if (memberLimit === null || memberLimit === undefined) return false;
  return memberCount >= memberLimit;
}

export function slotsRemaining(memberCount: number, memberLimit: number | null): number | null {
  if (memberLimit === null || memberLimit === undefined) return null;
  return Math.max(0, memberLimit - memberCount);
}

/**
 * Drops squads nobody else can join.
 *
 * Applied in application code rather than SQL because the comparison is between
 * two columns of the same row, which Prisma cannot express in a `where`.
 */
export function withFreeSlots<T extends { memberCount: number; memberLimit: number | null }>(
  squads: T[],
): T[] {
  return squads.filter((squad) => !isFull(squad.memberCount, squad.memberLimit));
}

/**
 * Squads whose *destination* is near a point.
 *
 * Destination is a nested GeoPoint rather than flat columns, so it cannot be
 * range-filtered in the query the way `lat`/`lng` can — this runs after the
 * database has narrowed by origin. Callers that filter by destination must
 * over-fetch accordingly.
 */
export function nearDestination<
  T extends { destination: unknown },
>(squads: T[], dest: { lat: number; lng: number }, radiusKm: number): T[] {
  return squads.filter((squad) => {
    const point = squad.destination as { lat?: unknown; lng?: unknown } | null;
    const lat = Number(point?.lat);
    const lng = Number(point?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
    return haversineKm(lat, lng, dest.lat, dest.lng) <= radiusKm;
  });
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}
