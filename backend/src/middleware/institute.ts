import { Response, NextFunction } from 'express';

import prisma from '../utils/prisma.js';
import { fail } from '../utils/respond.js';
import { instituteDomainList } from '../data/institutes.js';
import { AuthRequest } from '../types/express.js';

/**
 * Campus verification gate.
 *
 * Spllit's safety model is that everyone you travel with is a verified member
 * of a named institute. That claim is only true if it is enforced on the way
 * in, so any endpoint that puts a user in a vehicle or a group with strangers
 * sits behind this.
 *
 * Verification means the user proved ownership of an address on their
 * institute's domain by signing in to that Google account — a token Google
 * vouches for, checked server-side in POST /users/me/institute-email. A typed
 * address is never enough.
 *
 * Deliberately *not* applied to browsing. Seeing that rides exist is what
 * motivates someone to verify; hiding the map until they do leaves a new
 * account staring at nothing with no reason to continue.
 */
export async function requireVerifiedInstitute(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { instituteVerified: true, instituteId: true, college: true },
  });

  if (!user) {
    fail(res, 404, 'Profile not found', 'no-profile');
    return;
  }

  if (user.instituteVerified) {
    next();
    return;
  }

  if (!user.instituteId) {
    fail(
      res,
      403,
      'Choose your institute and verify your campus email first.',
      'institute-required',
    );
    return;
  }

  // Every accepted address, not just the canonical one — naming a single
  // domain tells a student on one of the others that theirs will not work.
  const domains = instituteDomainList(user.instituteId);
  fail(
    res,
    403,
    domains
      ? `Verify your ${domains} email to do this.`
      : `${user.college} has no verifiable email domain yet.`,
    'institute-unverified',
  );
}
