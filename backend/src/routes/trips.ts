import { Router, Response } from 'express';

import prisma from '../utils/prisma.js';
import { identify } from '../middleware/identity.js';
import { AuthRequest } from '../types/express.js';
import { ok, fail } from '../utils/respond.js';
import { notify } from '../services/notifications.js';
import { resolveThread } from '../services/threads.js';
import { formatPlate } from '../data/vehicles.js';

const router = Router();

/**
 * The rider side of matching: publishing intent, and answering invites.
 *
 * A search leaves nothing behind — it runs on the rider's screen and no host
 * can see it. A TripRequest is the opt-in that makes someone findable, and it
 * is what a host's corridor query matches against.
 */

const USER_SUMMARY = {
  id: true,
  name: true,
  username: true,
  profilePhoto: true,
  college: true,
  rating: true,
} as const;

const REQUEST_SELECT = {
  id: true,
  userId: true,
  originLabel: true,
  originLat: true,
  originLng: true,
  destLabel: true,
  destLat: true,
  destLng: true,
  departAt: true,
  windowMins: true,
  seats: true,
  status: true,
  expiresAt: true,
  createdAt: true,
} as const;

/**
 * Expires stale requests as a side effect of reading them.
 *
 * Cheaper and more reliable than a scheduler for this shape of data: the only
 * moment a stale request matters is when somebody is about to look at it, and
 * a container that restarts must not lose the sweep.
 */
async function sweepExpired(userId?: string) {
  await prisma.tripRequest.updateMany({
    where: {
      status: 'open',
      expiresAt: { lt: new Date() },
      ...(userId ? { userId } : {}),
    },
    data: { status: 'expired' },
  });
}

/** POST /api/trips/requests — publish or refresh the caller's intent. */
router.post('/requests', identify, async (req: AuthRequest, res: Response) => {
  try {
    const originLat = Number(req.body.originLat);
    const originLng = Number(req.body.originLng);
    const destLat = Number(req.body.destLat);
    const destLng = Number(req.body.destLng);

    if (![originLat, originLng, destLat, destLng].every(Number.isFinite)) {
      return fail(res, 400, 'A pickup and a destination are both required', 'no-route');
    }

    const departAt = new Date(String(req.body.departAt ?? ''));
    if (Number.isNaN(departAt.getTime())) {
      return fail(res, 400, 'A valid departure time is required');
    }
    if (departAt.getTime() < Date.now() - 60 * 60 * 1000) {
      return fail(res, 400, 'That departure time has already passed');
    }

    const windowMins = Math.min(Math.max(Number(req.body.windowMins) || 90, 15), 24 * 60);
    const seats = Math.min(Math.max(Number(req.body.seats) || 1, 1), 6);

    await sweepExpired(req.user!.userId);

    // One open request per person. Publishing again replaces the old one
    // rather than stacking, so a host never sees the same rider three times
    // with three slightly different plans.
    const existing = await prisma.tripRequest.findFirst({
      where: { userId: req.user!.userId, status: 'open' },
      select: { id: true },
    });

    const data = {
      userId: req.user!.userId,
      originLabel: String(req.body.originLabel ?? '').trim().slice(0, 160) || 'Pickup',
      originLat,
      originLng,
      destLabel: String(req.body.destLabel ?? '').trim().slice(0, 160) || 'Destination',
      destLat,
      destLng,
      departAt,
      windowMins,
      seats,
      status: 'open',
      // Dead an hour after the window closes — past that the rider has either
      // travelled or given up, and either way they are not waiting.
      expiresAt: new Date(departAt.getTime() + (windowMins + 60) * 60 * 1000),
    };

    const request = existing
      ? await prisma.tripRequest.update({
          where: { id: existing.id },
          data,
          select: REQUEST_SELECT,
        })
      : await prisma.tripRequest.create({ data, select: REQUEST_SELECT });

    return ok(res, request, existing ? 200 : 201);
  } catch (error) {
    console.error('[trips/requests POST]', error);
    return fail(res, 500, 'Failed to publish your trip');
  }
});

/** GET /api/trips/requests/mine — the caller's open request, or null. */
router.get('/requests/mine', identify, async (req: AuthRequest, res: Response) => {
  try {
    await sweepExpired(req.user!.userId);
    const request = await prisma.tripRequest.findFirst({
      where: { userId: req.user!.userId, status: 'open' },
      orderBy: { createdAt: 'desc' },
      select: REQUEST_SELECT,
    });
    return ok(res, request);
  } catch (error) {
    console.error('[trips/requests/mine]', error);
    return fail(res, 500, 'Failed to load your trip');
  }
});

/** DELETE /api/trips/requests/:id — stop being findable. */
router.delete('/requests/:id', identify, async (req: AuthRequest, res: Response) => {
  try {
    const updated = await prisma.tripRequest.updateMany({
      where: { id: req.params.id, userId: req.user!.userId, status: 'open' },
      data: { status: 'cancelled' },
    });
    if (updated.count === 0) return fail(res, 404, 'Trip not found');
    return res.status(204).end();
  } catch (error) {
    console.error('[trips/requests DELETE]', error);
    return fail(res, 500, 'Failed to withdraw your trip');
  }
});

/**
 * Everything a rider is owed about the host once they are actually on the
 * trip: who is driving, in what, and how to reach them.
 *
 * Only ever built for an accepted passenger or the host themselves. Handing a
 * driver's phone number and registration to anyone who can guess a ride id
 * would be the whole point of verification thrown away.
 */
async function hostDossier(rideUserId: string) {
  const [user, host] = await Promise.all([
    prisma.user.findUnique({ where: { id: rideUserId }, select: USER_SUMMARY }),
    prisma.hostProfile.findUnique({
      where: { userId: rideUserId },
      select: { id: true, phone: true, about: true, rating: true, ratingCount: true, ridesHosted: true },
    }),
  ]);

  if (!user) return null;

  const vehicle = host
    ? await prisma.vehicle.findFirst({
        where: { hostProfileId: host.id, status: 'verified' },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      })
    : null;

  return {
    user,
    phone: host?.phone ?? null,
    about: host?.about ?? null,
    rating: host?.rating ?? 0,
    ratingCount: host?.ratingCount ?? 0,
    ridesHosted: host?.ridesHosted ?? 0,
    vehicle: vehicle
      ? {
          type: vehicle.type,
          brandLabel: vehicle.brandLabel,
          modelLabel: vehicle.modelLabel,
          colour: vehicle.colour,
          plateFormatted: formatPlate(vehicle.plate),
          seats: vehicle.seats,
        }
      : null,
  };
}

/**
 * GET /api/trips/invites — invitations awaiting the caller's answer, plus the
 * trips they have already accepted.
 */
router.get('/invites', identify, async (req: AuthRequest, res: Response) => {
  try {
    const matches = await prisma.match.findMany({
      where: {
        user2Id: req.user!.userId,
        initiatedBy: 'host',
        status: { in: ['pending', 'accepted'] },
      },
      orderBy: { matchedAt: 'desc' },
      take: 50,
    });

    const rides = await prisma.ride.findMany({
      where: { id: { in: matches.map((m) => m.rideId) } },
    });
    const rideById = new Map(rides.map((ride) => [ride.id, ride]));

    // Only accepted invites unlock contact details, so the dossier is built
    // for those and nobody else.
    const dossiers = new Map(
      await Promise.all(
        [...new Set(matches.filter((m) => m.status === 'accepted').map((m) => m.user1Id))].map(
          async (id) => [id, await hostDossier(id)] as const,
        ),
      ),
    );

    const summaries = await prisma.user.findMany({
      where: { id: { in: [...new Set(matches.map((m) => m.user1Id))] } },
      select: USER_SUMMARY,
    });
    const summaryById = new Map(summaries.map((user) => [user.id, user]));

    const items = matches
      .map((match) => {
        const ride = rideById.get(match.rideId);
        if (!ride) return null;
        return {
          id: match.id,
          status: match.status,
          matchedAt: match.matchedAt,
          ride,
          // Pending invites get the public summary only.
          host: summaryById.get(match.user1Id) ?? null,
          dossier: match.status === 'accepted' ? (dossiers.get(match.user1Id) ?? null) : null,
          threadId: match.status === 'accepted' ? match.chatRoomId : null,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    return ok(res, items);
  } catch (error) {
    console.error('[trips/invites]', error);
    return fail(res, 500, 'Failed to load your invites');
  }
});

/** POST /api/trips/invites/:id/accept */
router.post('/invites/:id/accept', identify, async (req: AuthRequest, res: Response) => {
  try {
    const match = await prisma.match.findFirst({
      where: { id: req.params.id, user2Id: req.user!.userId, initiatedBy: 'host' },
    });
    if (!match) return fail(res, 404, 'Invite not found');
    if (match.status === 'accepted') return fail(res, 409, 'You already accepted this');
    if (match.status !== 'pending') return fail(res, 409, 'That invite is no longer open');

    const ride = await prisma.ride.findUnique({ where: { id: match.rideId } });
    if (!ride) return fail(res, 404, 'That trip no longer exists');
    if (['cancelled', 'completed'].includes(ride.status)) {
      return fail(res, 409, 'That trip is no longer running', 'ride-closed');
    }

    // The host may have filled the car between inviting and now. Counting at
    // accept time rather than at invite time is what stops an over-booking.
    const taken = await prisma.match.count({
      where: { rideId: ride.id, status: 'accepted' },
    });
    if (taken >= ride.seats) {
      await prisma.match.update({
        where: { id: match.id },
        data: { status: 'rejected', declinedAt: new Date() },
      });
      return fail(res, 409, 'That trip filled up before you accepted', 'ride-full');
    }

    await prisma.match.update({
      where: { id: match.id },
      data: { status: 'accepted', acceptedAt: new Date() },
    });

    if (match.requestId) {
      await prisma.tripRequest.updateMany({
        where: { id: match.requestId, userId: req.user!.userId },
        data: { status: 'matched' },
      });
    }

    // Chat opens on acceptance, not on invitation — an invite the rider never
    // answered should not create a conversation. Resolved as the rider, which
    // is also the membership check: describe() only returns a ride thread for
    // someone actually on the ride, which they now are.
    await resolveThread('ride', ride.id, req.user!.userId);

    await notify({
      userId: ride.userId,
      type: 'ride.accepted',
      title: 'Your invite was accepted',
      body: `Someone joined your trip to ${ride.destination}.`,
      href: `/rides/${ride.id}`,
      data: { rideId: ride.id },
    });

    return ok(res, {
      id: match.id,
      status: 'accepted',
      dossier: await hostDossier(ride.userId),
      threadId: match.chatRoomId,
    });
  } catch (error) {
    console.error('[trips/invites accept]', error);
    return fail(res, 500, 'Failed to accept the invite');
  }
});

/** POST /api/trips/invites/:id/decline */
router.post('/invites/:id/decline', identify, async (req: AuthRequest, res: Response) => {
  try {
    const updated = await prisma.match.updateMany({
      where: {
        id: req.params.id,
        user2Id: req.user!.userId,
        initiatedBy: 'host',
        status: 'pending',
      },
      data: { status: 'rejected', declinedAt: new Date() },
    });
    if (updated.count === 0) return fail(res, 404, 'Invite not found');
    return res.status(204).end();
  } catch (error) {
    console.error('[trips/invites decline]', error);
    return fail(res, 500, 'Failed to decline the invite');
  }
});

export default router;
export { hostDossier };
