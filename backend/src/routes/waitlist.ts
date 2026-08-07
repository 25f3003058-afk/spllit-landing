import { Router, Response } from 'express';

import prisma from '../utils/prisma.js';
import { identify, identifyOptional } from '../middleware/identity.js';
import { AuthRequest } from '../types/express.js';
import { ok, fail } from '../utils/respond.js';

const router = Router();

const SERVICES = new Set(['rentals', 'bills', 'marketplace']);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** POST /api/waitlist — Phase 2 notify-me capture. */
router.post('/', identifyOptional, async (req: AuthRequest, res: Response) => {
  try {
    const service = String(req.body.service ?? '');
    const email = String(req.body.email ?? '').trim().toLowerCase();

    if (!SERVICES.has(service)) return fail(res, 400, 'Unknown service');
    if (!EMAIL.test(email)) return fail(res, 400, 'Enter a valid email address');

    const user = req.user
      ? await prisma.user.findUnique({
          where: { id: req.user.userId },
          select: { college: true },
        })
      : null;

    // Re-submitting the same address is a no-op rather than an error — the
    // user's intent is "notify me", and they have already expressed it.
    const entry = await prisma.waitlist.upsert({
      where: { service_email: { service, email } },
      create: {
        service,
        email,
        userId: req.user?.userId ?? null,
        college: user?.college ?? null,
        note: req.body.note ? String(req.body.note).slice(0, 500) : null,
      },
      update: {
        ...(req.body.note ? { note: String(req.body.note).slice(0, 500) } : {}),
      },
    });

    return ok(res, { id: entry.id, service: entry.service }, 201);
  } catch (error) {
    console.error('[waitlist POST]', error);
    return fail(res, 500, 'Failed to join the waitlist');
  }
});

/** GET /api/waitlist/:service/status */
router.get('/:service/status', identify, async (req: AuthRequest, res: Response) => {
  try {
    const service = String(req.params.service);
    if (!SERVICES.has(service)) return fail(res, 404, 'Unknown service');

    const [count, mine] = await Promise.all([
      prisma.waitlist.count({ where: { service } }),
      prisma.waitlist.findFirst({
        where: { service, OR: [{ userId: req.user!.userId }, { email: req.user!.email }] },
        select: { id: true },
      }),
    ]);

    return ok(res, { joined: Boolean(mine), count });
  } catch (error) {
    console.error('[waitlist status]', error);
    return fail(res, 500, 'Failed to load waitlist status');
  }
});

export default router;
