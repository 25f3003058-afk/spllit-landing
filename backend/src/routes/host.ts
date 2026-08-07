import { Router, Response } from 'express';

import prisma from '../utils/prisma.js';
import { identify } from '../middleware/identity.js';
import { AuthRequest } from '../types/express.js';
import { ok, fail } from '../utils/respond.js';
import { verifyFirebaseIdToken, isFirebaseAdminConfigured } from '../utils/firebaseAdmin.js';
import {
  VEHICLE_BRANDS,
  findBrand,
  findModel,
  formatPlate,
  isValidPlate,
  normalisePlate,
} from '../data/vehicles.js';

const router = Router();

/**
 * Host mode.
 *
 * Becoming a host is two gates, both server-enforced:
 *   1. a phone number proven by a Firebase Phone OTP sign-in, and
 *   2. at least one verified vehicle.
 *
 * Only when both hold does the profile go `active`, and only an active profile
 * may post rides. The client shows and hides host UI, but never decides this —
 * `requireActiveHost` below is the authority.
 */

const VEHICLE_SELECT = {
  id: true,
  type: true,
  brandId: true,
  modelId: true,
  brandLabel: true,
  modelLabel: true,
  colour: true,
  plate: true,
  seats: true,
  status: true,
  rejectionNote: true,
  isPrimary: true,
  verifiedAt: true,
  createdAt: true,
} as const;

const PROFILE_SELECT = {
  id: true,
  userId: true,
  phone: true,
  phoneVerified: true,
  about: true,
  status: true,
  suspendedReason: true,
  ridesHosted: true,
  rating: true,
  ratingCount: true,
  createdAt: true,
} as const;

/** Adds the display form of each plate without storing a second copy. */
function shapeVehicle<T extends { plate: string }>(vehicle: T) {
  return { ...vehicle, plateFormatted: formatPlate(vehicle.plate) };
}

async function loadHost(userId: string) {
  const profile = await prisma.hostProfile.findUnique({
    where: { userId },
    select: PROFILE_SELECT,
  });
  if (!profile) return null;

  const vehicles = await prisma.vehicle.findMany({
    where: { hostProfileId: profile.id },
    select: VEHICLE_SELECT,
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
  });

  return { profile, vehicles: vehicles.map(shapeVehicle) };
}

/**
 * Recomputes `status` from the facts rather than trusting whatever set it
 * last. Called after every change that could flip eligibility, so a host who
 * deletes their only verified vehicle drops back to pending on the same write
 * instead of keeping a stale active flag.
 */
async function syncHostStatus(hostProfileId: string): Promise<string> {
  const profile = await prisma.hostProfile.findUnique({
    where: { id: hostProfileId },
    select: { phoneVerified: true, status: true },
  });
  if (!profile) return 'pending';

  // Suspension is an administrative decision and outranks eligibility.
  if (profile.status === 'suspended') return 'suspended';

  const verifiedVehicles = await prisma.vehicle.count({
    where: { hostProfileId, status: 'verified' },
  });

  const next = profile.phoneVerified && verifiedVehicles > 0 ? 'active' : 'pending';
  if (next !== profile.status) {
    await prisma.hostProfile.update({ where: { id: hostProfileId }, data: { status: next } });
  }
  return next;
}

/** Resolves the caller's active host profile, or the reason they have none. */
export async function requireActiveHost(userId: string) {
  const profile = await prisma.hostProfile.findUnique({
    where: { userId },
    select: { id: true, status: true, suspendedReason: true },
  });

  if (!profile) {
    return { profile: null, error: { status: 403, message: 'Set up host mode first', code: 'not-a-host' } };
  }
  if (profile.status === 'suspended') {
    return {
      profile: null,
      error: {
        status: 403,
        message: profile.suspendedReason ?? 'Host mode is suspended on this account',
        code: 'host-suspended',
      },
    };
  }
  if (profile.status !== 'active') {
    return {
      profile: null,
      error: {
        status: 403,
        message: 'Add and verify a vehicle before offering rides',
        code: 'host-incomplete',
      },
    };
  }
  return { profile, error: null };
}

/** GET /api/host/catalogue — brands and models for the vehicle form. */
router.get('/catalogue', identify, async (_req: AuthRequest, res: Response) => {
  return ok(res, { brands: VEHICLE_BRANDS });
});

/** GET /api/host/me — null when the caller has never opened host mode. */
router.get('/me', identify, async (req: AuthRequest, res: Response) => {
  try {
    return ok(res, await loadHost(req.user!.userId));
  } catch (error) {
    console.error('[host/me]', error);
    return fail(res, 500, 'Failed to load host profile');
  }
});

/**
 * POST /api/host/me — create or update the host profile.
 *
 * The phone number is taken from a Firebase ID token, not from the body. A
 * typed number proves nothing, and this is the number a passenger will be told
 * to call if a ride goes wrong.
 */
router.post('/me', identify, async (req: AuthRequest, res: Response) => {
  try {
    const idToken = typeof req.body.idToken === 'string' ? req.body.idToken.trim() : '';
    const about = typeof req.body.about === 'string' ? req.body.about.trim().slice(0, 400) : null;

    const existing = await prisma.hostProfile.findUnique({
      where: { userId: req.user!.userId },
      select: { id: true, phoneVerified: true },
    });

    // An established host editing their bio should not have to re-verify.
    if (existing?.phoneVerified && !idToken) {
      await prisma.hostProfile.update({
        where: { id: existing.id },
        data: { ...(about !== null ? { about } : {}) },
      });
      await syncHostStatus(existing.id);
      return ok(res, await loadHost(req.user!.userId));
    }

    if (!idToken) {
      return fail(res, 400, 'Verify your phone number to continue', 'phone-required');
    }
    if (!isFirebaseAdminConfigured()) {
      return fail(res, 503, 'Verification is not configured on this environment');
    }

    let decoded;
    try {
      decoded = await verifyFirebaseIdToken(idToken);
    } catch {
      return fail(res, 401, 'That phone verification could not be confirmed', 'bad-token');
    }

    const phone = String(decoded.phone_number ?? '').trim();
    if (!phone) {
      return fail(res, 400, 'Verify with a phone number, not an email account', 'no-phone');
    }

    // One phone, one host. Otherwise a suspended host re-registers under a
    // second account and keeps the same number on the road.
    const claimed = await prisma.hostProfile.findFirst({
      where: { phone, NOT: { userId: req.user!.userId } },
      select: { id: true },
    });
    if (claimed) {
      return fail(res, 409, 'That number is already registered to another host', 'phone-taken');
    }

    const profile = existing
      ? await prisma.hostProfile.update({
          where: { id: existing.id },
          data: { phone, phoneVerified: true, ...(about !== null ? { about } : {}) },
          select: { id: true },
        })
      : await prisma.hostProfile.create({
          data: { userId: req.user!.userId, phone, phoneVerified: true, about },
          select: { id: true },
        });

    await syncHostStatus(profile.id);
    return ok(res, await loadHost(req.user!.userId), existing ? 200 : 201);
  } catch (error) {
    console.error('[host/me POST]', error);
    return fail(res, 500, 'Failed to save host profile');
  }
});

/** POST /api/host/vehicles — register a vehicle for verification. */
router.post('/vehicles', identify, async (req: AuthRequest, res: Response) => {
  try {
    const profile = await prisma.hostProfile.findUnique({
      where: { userId: req.user!.userId },
      select: { id: true },
    });
    if (!profile) return fail(res, 403, 'Set up host mode first', 'not-a-host');

    const brandId = String(req.body.brandId ?? '');
    const modelId = String(req.body.modelId ?? '');
    const brand = findBrand(brandId);
    const model = findModel(brandId, modelId);

    if (!brand || !model) {
      return fail(res, 400, 'Pick a brand and model from the list', 'unknown-vehicle');
    }

    const plate = normalisePlate(String(req.body.plate ?? ''));
    if (!isValidPlate(plate)) {
      return fail(
        res,
        400,
        'That does not look like an Indian registration number (e.g. TN 07 CV 1234)',
        'bad-plate',
      );
    }

    const duplicate = await prisma.vehicle.findFirst({
      where: { plate, NOT: { hostProfileId: profile.id } },
      select: { id: true },
    });
    if (duplicate) {
      return fail(res, 409, 'That registration is already on another account', 'plate-taken');
    }

    const mine = await prisma.vehicle.findFirst({
      where: { plate, hostProfileId: profile.id },
      select: { id: true },
    });
    if (mine) return fail(res, 409, 'You have already added that vehicle', 'plate-exists');

    // Seats are capped by what the model actually has; a host cannot advertise
    // six seats in a hatchback by editing the request.
    const requested = Number(req.body.seats);
    const seats = Math.min(
      Math.max(Number.isFinite(requested) ? requested : model.seats, 1),
      model.seats,
    );

    const count = await prisma.vehicle.count({ where: { hostProfileId: profile.id } });
    if (count >= 5) return fail(res, 429, 'You can register up to five vehicles');

    const vehicle = await prisma.vehicle.create({
      data: {
        hostProfileId: profile.id,
        type: brand.type,
        brandId: brand.id,
        modelId: model.id,
        brandLabel: brand.label,
        modelLabel: model.label,
        colour:
          typeof req.body.colour === 'string' && req.body.colour.trim()
            ? req.body.colour.trim().slice(0, 30)
            : null,
        plate,
        seats,
        // The first vehicle is primary by definition; later ones are not until
        // the host says so.
        isPrimary: count === 0,
        status: 'pending',
      },
      select: VEHICLE_SELECT,
    });

    await syncHostStatus(profile.id);
    return ok(res, shapeVehicle(vehicle), 201);
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') {
      return fail(res, 409, 'That registration is already on another account', 'plate-taken');
    }
    console.error('[host/vehicles POST]', error);
    return fail(res, 500, 'Failed to add the vehicle');
  }
});

/** POST /api/host/vehicles/:id/primary — pick the default vehicle. */
router.post('/vehicles/:id/primary', identify, async (req: AuthRequest, res: Response) => {
  try {
    const profile = await prisma.hostProfile.findUnique({
      where: { userId: req.user!.userId },
      select: { id: true },
    });
    if (!profile) return fail(res, 403, 'Set up host mode first', 'not-a-host');

    const vehicle = await prisma.vehicle.findFirst({
      where: { id: req.params.id, hostProfileId: profile.id },
      select: { id: true, status: true },
    });
    if (!vehicle) return fail(res, 404, 'Vehicle not found');
    if (vehicle.status !== 'verified') {
      return fail(res, 400, 'Only a verified vehicle can be your default', 'not-verified');
    }

    // Cleared first so there is never a moment with two primaries, and never a
    // moment with none that a concurrent read could observe as "unset".
    await prisma.vehicle.updateMany({
      where: { hostProfileId: profile.id, isPrimary: true },
      data: { isPrimary: false },
    });
    await prisma.vehicle.update({ where: { id: vehicle.id }, data: { isPrimary: true } });

    return ok(res, await loadHost(req.user!.userId));
  } catch (error) {
    console.error('[host/vehicles primary]', error);
    return fail(res, 500, 'Failed to update the default vehicle');
  }
});

/** DELETE /api/host/vehicles/:id */
router.delete('/vehicles/:id', identify, async (req: AuthRequest, res: Response) => {
  try {
    const profile = await prisma.hostProfile.findUnique({
      where: { userId: req.user!.userId },
      select: { id: true },
    });
    if (!profile) return fail(res, 403, 'Set up host mode first', 'not-a-host');

    const vehicle = await prisma.vehicle.findFirst({
      where: { id: req.params.id, hostProfileId: profile.id },
      select: { id: true, isPrimary: true },
    });
    if (!vehicle) return fail(res, 404, 'Vehicle not found');

    await prisma.vehicle.delete({ where: { id: vehicle.id } });

    // Promote the next verified vehicle so the host is not left with a fleet
    // and no default.
    if (vehicle.isPrimary) {
      const next = await prisma.vehicle.findFirst({
        where: { hostProfileId: profile.id, status: 'verified' },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });
      if (next) {
        await prisma.vehicle.update({ where: { id: next.id }, data: { isPrimary: true } });
      }
    }

    await syncHostStatus(profile.id);
    return ok(res, await loadHost(req.user!.userId));
  } catch (error) {
    console.error('[host/vehicles DELETE]', error);
    return fail(res, 500, 'Failed to remove the vehicle');
  }
});

export default router;
export { syncHostStatus };
