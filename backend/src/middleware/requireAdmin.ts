import { Response, NextFunction } from 'express';

import prisma from '../utils/prisma.js';
import { AuthRequest } from '../types/express.js';

/**
 * Admin gate. Runs after `identify`, so `req.user` is already resolved from
 * either token scheme; this only decides whether that identity is privileged.
 *
 * The role is read from the database on every request rather than trusted from
 * the token — revoking an admin must take effect immediately, not whenever
 * their session happens to expire.
 */
export async function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { role: true, isAdmin: true, adminStatus: true, isActive: true },
  });

  const privileged =
    Boolean(user) &&
    user!.isActive &&
    user!.adminStatus === 'active' &&
    (user!.isAdmin || user!.role === 'admin' || user!.role === 'subadmin');

  if (!privileged) {
    // Deliberately a 404, not a 403: an unprivileged caller should not be able
    // to confirm that an admin surface exists at this path.
    res.status(404).json({ success: false, message: 'Not found' });
    return;
  }

  next();
}

/** Master-admin only — destructive operations and role changes. */
export async function requireMasterAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { role: true, isAdmin: true, adminStatus: true, isActive: true },
  });

  if (!user?.isActive || user.adminStatus !== 'active' || user.role !== 'admin') {
    res.status(404).json({ success: false, message: 'Not found' });
    return;
  }

  next();
}
