import { Router, Response } from 'express';

import prisma from '../utils/prisma.js';
import { identify } from '../middleware/identity.js';
import { AuthRequest } from '../types/express.js';
import { ok, fail, parseCoords } from '../utils/respond.js';

const router = Router();

const USER_SUMMARY = {
  id: true,
  name: true,
  username: true,
  profilePhoto: true,
  college: true,
  rating: true,
} as const;

const MAPBOX_TOKEN = process.env.MAPBOX_SECRET_TOKEN ?? process.env.MAPBOX_TOKEN ?? '';

/** Escapes regex metacharacters so a user typing "c++" doesn't blow up. */
function safe(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function geocode(query: string, near: { lat: number; lng: number } | null) {
  if (!MAPBOX_TOKEN) return [];
  try {
    const url = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
    );
    url.searchParams.set('access_token', MAPBOX_TOKEN);
    url.searchParams.set('limit', '5');
    if (near) url.searchParams.set('proximity', `${near.lng},${near.lat}`);

    const response = await fetch(url.toString());
    if (!response.ok) return [];
    const payload = (await response.json()) as {
      features?: { id: string; text: string; place_name: string; center: [number, number] }[];
    };
    return (payload.features ?? []).map((feature) => ({
      id: feature.id,
      name: feature.text,
      address: feature.place_name,
      center: feature.center,
    }));
  } catch (error) {
    console.error('[search/geocode]', error);
    return [];
  }
}

/**
 * GET /api/search?q=…&tab=…
 *
 * One round trip that fans out across every entity type plus Mapbox geocoding
 * and merges the results. Deliberately server-side: the client never filters a
 * local array, so results stay correct as the dataset grows past what a page
 * could hold.
 */
router.get('/', identify, async (req: AuthRequest, res: Response) => {
  try {
    const q = String(req.query.q ?? '').trim();
    if (q.length < 2) {
      return ok(res, {
        people: [],
        squads: [],
        events: [],
        communities: [],
        places: [],
        rides: [],
      });
    }

    const tab = req.query.tab ? String(req.query.tab) : null;
    const near = parseCoords(req.query);
    const pattern = safe(q);
    const contains = { contains: pattern, mode: 'insensitive' as const };

    // A tab request narrows the fan-out to one source instead of six.
    const want = (name: string) => !tab || tab === name;

    const [people, squads, events, communities, rides, places] = await Promise.all([
      want('people')
        ? prisma.user.findMany({
            where: {
              isActive: true,
              onboarded: true,
              id: { not: req.user!.userId },
              OR: [{ name: contains }, { username: contains }, { college: contains }],
            },
            select: USER_SUMMARY,
            take: 20,
          })
        : [],

      want('squads')
        ? prisma.squad.findMany({
            where: {
              isActive: true,
              visibility: 'public',
              OR: [{ name: contains }, { description: contains }],
            },
            take: 20,
          })
        : [],

      want('events')
        ? prisma.event.findMany({
            where: {
              status: 'published',
              startsAt: { gte: new Date() },
              OR: [{ title: contains }, { description: contains }, { category: contains }],
            },
            orderBy: { startsAt: 'asc' },
            take: 20,
          })
        : [],

      want('communities')
        ? prisma.community.findMany({
            where: {
              visibility: { not: 'private' },
              OR: [{ name: contains }, { description: contains }],
            },
            orderBy: { memberCount: 'desc' },
            take: 20,
          })
        : [],

      want('rides')
        ? prisma.ride.findMany({
            where: {
              status: { in: ['requested', 'pending', 'accepted', 'matched'] },
              departureTime: { gte: new Date() },
              OR: [{ destination: contains }, { origin: contains }],
            },
            orderBy: { departureTime: 'asc' },
            take: 20,
          })
        : [],

      want('places') ? geocode(q, near) : [],
    ]);

    // Hydrate the denormalised author fields the cards render.
    const userIds = [
      ...new Set([
        ...squads.map((s) => s.leaderId),
        ...events.map((e) => e.hostId),
        ...rides.map((r) => r.userId),
      ]),
    ];
    const authors = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: USER_SUMMARY,
    });
    const byId = new Map(authors.map((a) => [a.id, a]));

    return ok(res, {
      people,
      squads: squads.map((s) => ({ ...s, leader: byId.get(s.leaderId) ?? null })),
      events: events.map((e) => ({ ...e, host: byId.get(e.hostId) ?? null })),
      communities,
      places,
      rides: rides.map((r) => ({
        ...r,
        host: byId.get(r.userId) ?? null,
        passengers: [],
        seatsTaken: 0,
        stops: r.stops ?? [],
      })),
    });
  } catch (error) {
    console.error('[search]', error);
    return fail(res, 500, 'Search failed');
  }
});

export default router;
