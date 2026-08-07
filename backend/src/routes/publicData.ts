import { Router, Request, Response } from 'express';

import prisma from '../utils/prisma.js';
import { ok, fail, boundingBox, parseCoords } from '../utils/respond.js';

const router = Router();

/**
 * Pre-auth endpoints for the landing page.
 *
 * PRIVACY BOUNDARY: nothing returned here identifies a user, a ride or a squad.
 * Positions are snapped to a coarse grid and reported as aggregate counts per
 * cell, so a logged-out visitor learns "there is activity in this area" and
 * nothing more. Do not add identifying fields to these responses.
 */

/** ~0.0025° ≈ 250 m. Coarse enough that a cell never points at one person. */
const GRID = 0.0025;

/** Cells with fewer than this many entities are dropped entirely. */
const MIN_CELL_COUNT = 1;

function snap(value: number): number {
  return Math.round(value / GRID) * GRID;
}

router.get('/map-preview', async (req: Request, res: Response) => {
  try {
    const coords = parseCoords(req.query);
    const box = coords ? boundingBox(coords.lat, coords.lng, 25) : null;
    const now = new Date();

    const [rides, squads, events] = await Promise.all([
      prisma.ride.findMany({
        where: {
          status: { in: ['requested', 'accepted', 'arriving', 'in_progress'] },
          departureTime: { gte: new Date(now.getTime() - 60 * 60 * 1000) },
          originLat: { not: null },
          originLng: { not: null },
          ...(box
            ? {
                originLat: { gte: box.minLat, lte: box.maxLat, not: null },
                originLng: { gte: box.minLng, lte: box.maxLng, not: null },
              }
            : {}),
        },
        select: { originLat: true, originLng: true },
        take: 400,
      }),
      prisma.squad.findMany({
        where: {
          isActive: true,
          visibility: 'public',
          lat: { not: null },
          lng: { not: null },
          ...(box
            ? {
                lat: { gte: box.minLat, lte: box.maxLat, not: null },
                lng: { gte: box.minLng, lte: box.maxLng, not: null },
              }
            : {}),
        },
        select: { lat: true, lng: true },
        take: 400,
      }),
      prisma.event.findMany({
        where: { status: 'published', startsAt: { gte: now } },
        select: { venue: true },
        take: 400,
      }),
    ]);

    const cells = new Map<string, { kind: string; lat: number; lng: number; count: number }>();

    const add = (kind: string, lat: number | null, lng: number | null) => {
      if (lat === null || lng === null) return;
      const sLat = snap(lat);
      const sLng = snap(lng);
      const key = `${kind}:${sLat.toFixed(4)}:${sLng.toFixed(4)}`;
      const existing = cells.get(key);
      if (existing) existing.count += 1;
      else cells.set(key, { kind, lat: sLat, lng: sLng, count: 1 });
    };

    for (const ride of rides) add('ride', ride.originLat, ride.originLng);
    for (const squad of squads) add('squad', squad.lat, squad.lng);
    for (const event of events) {
      if (box) {
        const { lat, lng } = event.venue;
        if (lat < box.minLat || lat > box.maxLat || lng < box.minLng || lng > box.maxLng) {
          continue;
        }
      }
      add('event', event.venue.lat, event.venue.lng);
    }

    const markers = [...cells.entries()]
      .filter(([, cell]) => cell.count >= MIN_CELL_COUNT)
      .map(([key, cell]) => ({
        id: key,
        kind: cell.kind,
        position: [cell.lng, cell.lat],
        count: cell.count,
      }));

    return ok(res, markers);
  } catch (error) {
    console.error('[public/map-preview]', error);
    return fail(res, 500, 'Failed to load preview');
  }
});

/**
 * Real counters for the landing page. The client omits the social-proof line
 * entirely when these are zero — no invented numbers anywhere.
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const weekOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [activeRides, activeSquads, upcomingEvents, colleges] = await Promise.all([
      prisma.ride.count({
        where: {
          status: { in: ['requested', 'accepted', 'arriving', 'in_progress'] },
          departureTime: { gte: now },
        },
      }),
      prisma.squad.count({ where: { isActive: true } }),
      prisma.event.count({
        where: { status: 'published', startsAt: { gte: now, lte: weekOut } },
      }),
      prisma.user
        .findMany({ distinct: ['college'], select: { college: true } })
        .then((rows) => rows.filter((r) => r.college?.trim()).length),
    ]);

    return ok(res, { activeRides, activeSquads, upcomingEvents, colleges });
  } catch (error) {
    console.error('[public/stats]', error);
    return fail(res, 500, 'Failed to load stats');
  }
});

export default router;
