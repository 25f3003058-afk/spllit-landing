import { Router, Response } from 'express';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { AuthRequest } from '../types/express.js';
import { sanitizeUser } from '../utils/helpers.js';
import { deprecated } from '../middleware/deprecation.js';

const router = Router();

/** Deprecated router — usage is recorded so deletion can be justified by
 *  runtime evidence. See docs/DEPRECATION-POLICY.md. */
router.use(deprecated('users'));

const getCurrentProfile = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId }
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.json({ user: sanitizeUser(user) });
};

const updateCurrentProfile = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { name, college, profilePhoto, phone, gender, dateOfBirth } = req.body;
  const normalizedDateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;

  const user = await prisma.user.update({
    where: { id: req.user.userId },
    data: {
      ...(name && { name }),
      ...(college && { college }),
      ...(profilePhoto && { profilePhoto }),
      ...(phone !== undefined && { phone: phone || null }),
      ...(gender && { gender }),
      ...(dateOfBirth && { dateOfBirth: normalizedDateOfBirth })
    }
  });

  return res.json({
    message: 'Profile updated successfully',
    user: sanitizeUser(user)
  });
};

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await getCurrentProfile(req, res);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

/**
 * PUT /api/users/me
 * Update current user profile
 */
router.put('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await updateCurrentProfile(req, res);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.get('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await getCurrentProfile(req, res);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await updateCurrentProfile(req, res);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/*
 * GET /api/users/:id was migrated to routes/usersPlatform.ts on 2026-08-07.
 *
 * The replacement is mounted ahead of this router and accepts a strict superset
 * of this one's auth schemes (backend JWT *and* Firebase ID token) while
 * returning byte-identical success and not-found bodies, so no caller can
 * observe the move. Re-adding a /:id handler here would be dead code — this
 * router is mounted second, and a single-segment path can never reach it.
 *
 * The endpoints above remain because /users/me and /users/profile return a
 * shape mobile clients are documented as depending on. They stay until runtime
 * instrumentation proves no traffic. See docs/DEPRECATION-POLICY.md.
 */

export default router;
