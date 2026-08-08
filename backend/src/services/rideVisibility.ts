/**
 * One definition of "can a guest still join this ride".
 *
 * The rules lived inline in each handler and had already drifted: /search
 * excluded the viewer's own rides, /nearby did not, and neither checked whether
 * the vehicle was full. So a host saw their own ride in the list of rides to
 * join, and everyone saw rides with no seats left — both of which read as
 * "tap it and find out", which is the confusion this module exists to remove.
 *
 * Every guest-facing ride surface goes through here. Host-facing views
 * deliberately do not: a host must still see their own full or departed ride.
 */

/**
 * Live states. `in_progress` is excluded on purpose — a journey already under
 * way cannot take a new passenger, even though the row is not finished.
 * `pending` and `matched` are legacy spellings of requested/accepted.
 */
export const JOINABLE_STATUSES = ['requested', 'pending', 'accepted', 'matched', 'arriving'];

/**
 * How long a ride stays listed after its departure time.
 *
 * Not zero: people run late, and a ride leaving "now" is exactly the one a
 * guest standing at the gate wants. Half an hour is long enough to catch that
 * and short enough that the list is not full of departed rides.
 */
export const DEPARTED_GRACE_MINUTES = 30;

/**
 * Hard expiry, measured from departure rather than creation.
 *
 * Creation is the wrong anchor even though it is the intuitive one: a ride
 * posted a week in advance is legitimate and must not vanish for being "old".
 * What makes a listing stale is that its departure has passed and nobody ever
 * closed it out — a host who posted a 9am ride and never touched the app again
 * leaves it sitting there. After this long past departure it is gone from guest
 * views regardless of status.
 */
export const STALE_AFTER_DEPARTURE_HOURS = 5;

/**
 * Prisma `where` fragment for rides a guest could join.
 *
 * `viewerId` is excluded from the results. Seeing your own ride offered back to
 * you is the single most confusing thing a listing can do, and it is why the
 * two "create" affordances felt like duplicates.
 */
export function joinableRideWhere(viewerId?: string | null, now: Date = new Date()) {
  const graceStart = new Date(now.getTime() - DEPARTED_GRACE_MINUTES * 60 * 1000);

  return {
    ...(viewerId ? { userId: { not: viewerId } } : {}),
    status: { in: JOINABLE_STATUSES },
    // One bound, not two: anything older than the grace window is already
    // excluded, so STALE_AFTER_DEPARTURE_HOURS never needs its own clause here.
    // It exists for the sweep below, which cleans up rows this query hides.
    departureTime: { gte: graceStart },
  };
}

/** True once a ride is old enough that it should be closed, not just hidden. */
export function isStale(departureTime: Date, now: Date = new Date()): boolean {
  return departureTime.getTime() < now.getTime() - STALE_AFTER_DEPARTURE_HOURS * 3600 * 1000;
}

/**
 * Seats left on a ride.
 *
 * `seats` is what the host advertised. Only *accepted* matches consume one — a
 * pending request has not been approved and must not make the ride look full,
 * or a host with five hopeful requests would disappear from search before
 * choosing any of them.
 */
export function seatsRemaining(seats: number, acceptedPassengers: number): number {
  return Math.max(0, seats - acceptedPassengers);
}

export function hasSeatFree(seats: number, acceptedPassengers: number): boolean {
  return seatsRemaining(seats, acceptedPassengers) > 0;
}

/**
 * Capacity filter, applied in application code rather than SQL.
 *
 * Seats taken is a count of related Match rows, which Prisma cannot compare
 * against a column of the parent in a `where`. Doing it here keeps one
 * definition of full rather than a raw query that would drift from the rest.
 */
export function withFreeSeats<T extends { id: string; seats: number }>(
  rides: T[],
  acceptedByRide: Map<string, { length: number }>,
): T[] {
  return rides.filter((ride) => hasSeatFree(ride.seats, acceptedByRide.get(ride.id)?.length ?? 0));
}
