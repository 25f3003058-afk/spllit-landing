import { Router, Response } from 'express';

import { identify } from '../middleware/identity.js';
import { AuthRequest } from '../types/express.js';
import { ok, fail, parseCoords } from '../utils/respond.js';
import { nearestRoad } from '../services/pickup.js';

const router = Router();

/**
 * GET /api/pickup?lng=…&lat=…
 *
 * The nearest road a car can use, and how far it is from the pin. Nothing here
 * decides what to do about the answer — the client does, in `lib/pickup-advice`,
 * and it never moves a pin the user placed without offering first.
 *
 * `identify` rather than `requireAuth`: this is the same class of lookup as
 * search, it costs one cached tile query, and it is asked while someone is still
 * deciding whether to create a squad at all.
 */
router.get('/', identify, async (req: AuthRequest, res: Response) => {
  const near = parseCoords(req.query as Record<string, unknown>);
  if (!near) return fail(res, 400, 'lng and lat are required');
  if (Math.abs(near.lat) > 90 || Math.abs(near.lng) > 180) {
    return fail(res, 400, 'Coordinates out of range');
  }

  // `nearestRoad` never rejects: it answers 'unavailable' instead, because a
  // failed road lookup must not stop a pin from being confirmed.
  const snap = await nearestRoad(near.lng, near.lat);
  return ok(res, snap);
});

export default router;
