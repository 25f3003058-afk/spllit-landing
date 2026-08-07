import { Router, Response } from 'express';

import prisma from '../utils/prisma.js';
import { identify } from '../middleware/identity.js';
import { AuthRequest } from '../types/express.js';
import { ok, fail, boundingBox, parseCoords } from '../utils/respond.js';
import { calculateDistanceMetres } from '../utils/helpers.js';

const router = Router();

const USER_SUMMARY = {
  id: true,
  name: true,
  username: true,
  profilePhoto: true,
  college: true,
  rating: true,
} as const;

/** GET /api/events/feed — upcoming published events near a point. */
router.get('/feed', identify, async (req: AuthRequest, res: Response) => {
  try {
    const coords = parseCoords(req.query);
    const radiusKm = Math.min(Number(req.query.radiusKm) || 25, 100);
    const limit = Math.min(Number(req.query.limit) || 20, 60);
    const from = req.query.from ? new Date(String(req.query.from)) : new Date();

    const events = await prisma.event.findMany({
      where: {
        status: 'published',
        startsAt: { gte: from },
        ...(req.query.college ? { college: String(req.query.college) } : {}),
        ...(req.query.category ? { category: String(req.query.category) } : {}),
      },
      orderBy: { startsAt: 'asc' },
      take: limit * 3,
    });

    const hosts = await prisma.user.findMany({
      where: { id: { in: [...new Set(events.map((e) => e.hostId))] } },
      select: USER_SUMMARY,
    });
    const byId = new Map(hosts.map((h) => [h.id, h]));

    const attending = req.user
      ? await prisma.eventAttendee.findMany({
          where: {
            userId: req.user.userId,
            eventId: { in: events.map((e) => e.id) },
            status: 'going',
          },
          select: { eventId: true },
        })
      : [];
    const attendingIds = new Set(attending.map((a) => a.eventId));

    // Venue coordinates live in an embedded document, so the radius filter is
    // applied here rather than in the query.
    const box = coords ? boundingBox(coords.lat, coords.lng, radiusKm) : null;
    const items = events
      .filter((event) => {
        if (!box) return true;
        return (
          event.venue.lat >= box.minLat &&
          event.venue.lat <= box.maxLat &&
          event.venue.lng >= box.minLng &&
          event.venue.lng <= box.maxLng
        );
      })
      .slice(0, limit)
      .map((event) => ({
        ...event,
        host: byId.get(event.hostId) ?? null,
        viewerAttending: attendingIds.has(event.id),
        ...(coords
          ? {
              distanceMetres: calculateDistanceMetres(
                coords.lat,
                coords.lng,
                event.venue.lat,
                event.venue.lng,
              ),
            }
          : {}),
      }));

    return ok(res, { items, nextCursor: null });
  } catch (error) {
    console.error('[events/feed]', error);
    return fail(res, 500, 'Failed to load events');
  }
});

router.get('/:id', identify, async (req: AuthRequest, res: Response) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) return fail(res, 404, 'Event not found');

    const [host, attendance] = await Promise.all([
      prisma.user.findUnique({ where: { id: event.hostId }, select: USER_SUMMARY }),
      prisma.eventAttendee.findUnique({
        where: { eventId_userId: { eventId: event.id, userId: req.user!.userId } },
      }),
    ]);

    return ok(res, {
      ...event,
      host,
      viewerAttending: attendance?.status === 'going',
    });
  } catch (error) {
    console.error('[events/:id]', error);
    return fail(res, 500, 'Failed to load event');
  }
});

router.post('/', identify, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, venue, startsAt, endsAt, ticketType, price, capacity, category } =
      req.body;

    if (typeof title !== 'string' || title.trim().length < 3) {
      return fail(res, 400, 'Title must be at least 3 characters');
    }
    if (!venue || !Number.isFinite(Number(venue.lat)) || !Number.isFinite(Number(venue.lng))) {
      return fail(res, 400, 'A venue location is required');
    }
    if (!startsAt || Number.isNaN(new Date(startsAt).getTime())) {
      return fail(res, 400, 'A valid start time is required');
    }

    const recent = await prisma.event.count({
      where: {
        hostId: req.user!.userId,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });
    if (recent >= 5) return fail(res, 429, 'Too many events created in the last hour');

    const host = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { college: true },
    });

    const event = await prisma.event.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        hostId: req.user!.userId,
        college: host?.college ?? null,
        venue: {
          lat: Number(venue.lat),
          lng: Number(venue.lng),
          label: venue.label ?? null,
          address: venue.address ?? null,
        },
        startsAt: new Date(startsAt),
        endsAt: endsAt ? new Date(endsAt) : null,
        ticketType: ticketType === 'paid' ? 'paid' : 'free',
        price: ticketType === 'paid' && price ? Number(price) : null,
        capacity: capacity ? Number(capacity) : null,
        category: category || null,
        attendeeCount: 0,
      },
    });

    return ok(res, event, 201);
  } catch (error) {
    console.error('[events POST]', error);
    return fail(res, 500, 'Failed to create event');
  }
});

/** POST /api/events/:id/attend — idempotent RSVP toggle. */
router.post('/:id/attend', identify, async (req: AuthRequest, res: Response) => {
  try {
    const status =
      req.body.status === 'interested'
        ? 'interested'
        : req.body.status === 'cancelled'
          ? 'cancelled'
          : 'going';

    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) return fail(res, 404, 'Event not found');

    const existing = await prisma.eventAttendee.findUnique({
      where: { eventId_userId: { eventId: event.id, userId: req.user!.userId } },
    });

    const wasGoing = existing?.status === 'going';
    const isGoing = status === 'going';

    if (isGoing && event.capacity && event.attendeeCount >= event.capacity && !wasGoing) {
      return fail(res, 409, 'This event is full');
    }

    if (existing) {
      await prisma.eventAttendee.update({ where: { id: existing.id }, data: { status } });
    } else {
      await prisma.eventAttendee.create({
        data: { eventId: event.id, userId: req.user!.userId, status },
      });
    }

    // Only adjust the counter when the going/not-going state actually flips.
    const delta = isGoing && !wasGoing ? 1 : !isGoing && wasGoing ? -1 : 0;
    const updated = delta
      ? await prisma.event.update({
          where: { id: event.id },
          data: { attendeeCount: { increment: delta } },
        })
      : event;

    return ok(res, { ...updated, viewerAttending: isGoing });
  } catch (error) {
    console.error('[events/attend]', error);
    return fail(res, 500, 'Failed to update attendance');
  }
});

export default router;
