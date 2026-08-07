import { Router, Response } from 'express';

import prisma from '../utils/prisma.js';
import { identify } from '../middleware/identity.js';
import { AuthRequest } from '../types/express.js';
import { ok, fail, boundingBox, parseCoords } from '../utils/respond.js';
import { calculateDistance } from '../utils/helpers.js';
import { notify } from '../services/notifications.js';
import { getIO } from '../services/live.js';
import {
  ACTIVE_MEMBER_STATUSES,
  allocateJoinCode,
  membershipOf,
  progressToMeetingPoint,
  recordPosition,
  transferLeadership,
  SQUAD_ROLES,
  type SquadRole,
} from '../services/squads.js';

const router = Router();

const USER_SUMMARY = {
  id: true,
  name: true,
  username: true,
  profilePhoto: true,
  college: true,
  rating: true,
} as const;

async function attachLeaders(squads: { leaderId: string }[]) {
  const ids = [...new Set(squads.map((s) => s.leaderId))];
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: USER_SUMMARY,
  });
  return new Map(users.map((u) => [u.id, u]));
}

/**
 * GET /api/squads/nearby
 * Public squads within a radius, nearest first.
 */
router.get('/nearby', identify, async (req: AuthRequest, res: Response) => {
  try {
    const coords = parseCoords(req.query);
    const radiusKm = Math.min(Number(req.query.radiusKm) || 10, 50);
    const limit = Math.min(Number(req.query.limit) || 20, 60);

    const box = coords ? boundingBox(coords.lat, coords.lng, radiusKm) : null;

    const squads = await prisma.squad.findMany({
      where: {
        isActive: true,
        visibility: 'public',
        ...(req.query.college ? { college: String(req.query.college) } : {}),
        ...(box
          ? {
              lat: { gte: box.minLat, lte: box.maxLat },
              lng: { gte: box.minLng, lte: box.maxLng },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const leaders = await attachLeaders(squads);

    // Exact distance sort after the bounding-box prefilter.
    const items = squads
      .map((squad) => ({
        ...squad,
        leader: leaders.get(squad.leaderId) ?? null,
        _distance:
          coords && squad.lat !== null && squad.lng !== null
            ? calculateDistance(coords.lat, coords.lng, squad.lat, squad.lng)
            : Number.MAX_SAFE_INTEGER,
      }))
      .sort((a, b) => a._distance - b._distance)
      .map(({ _distance, ...squad }) => squad);

    return ok(res, { items, nextCursor: null });
  } catch (error) {
    console.error('[squads/nearby]', error);
    return fail(res, 500, 'Failed to load squads');
  }
});

/** GET /api/squads/mine — squads the caller is an active member of. */
router.get('/mine', identify, async (req: AuthRequest, res: Response) => {
  try {
    const memberships = await prisma.squadMember.findMany({
      where: { userId: req.user!.userId, status: 'active' },
      select: { squadId: true, role: true },
    });

    const squads = await prisma.squad.findMany({
      where: { id: { in: memberships.map((m) => m.squadId) } },
      orderBy: { updatedAt: 'desc' },
    });

    const leaders = await attachLeaders(squads);
    const roleBySquad = new Map(memberships.map((m) => [m.squadId, m.role]));

    return ok(
      res,
      squads.map((squad) => ({
        ...squad,
        leader: leaders.get(squad.leaderId) ?? null,
        viewerRole: roleBySquad.get(squad.id) ?? null,
      })),
    );
  } catch (error) {
    console.error('[squads/mine]', error);
    return fail(res, 500, 'Failed to load your squads');
  }
});

/** GET /api/squads/:id — private squads are members-only. */
router.get('/:id', identify, async (req: AuthRequest, res: Response) => {
  try {
    const squad = await prisma.squad.findUnique({ where: { id: req.params.id } });
    if (!squad) return fail(res, 404, 'Squad not found');

    const membership = await prisma.squadMember.findUnique({
      where: { squadId_userId: { squadId: squad.id, userId: req.user!.userId } },
    });

    // Authorisation is enforced here, not by hiding UI.
    if (squad.visibility === 'private' && !membership) {
      return fail(res, 403, 'This squad is invite only');
    }

    const members = await prisma.squadMember.findMany({
      where: { squadId: squad.id, status: { in: [...ACTIVE_MEMBER_STATUSES] } },
      orderBy: { joinedAt: 'asc' },
    });

    const users = await prisma.user.findMany({
      where: { id: { in: members.map((m) => m.userId) } },
      select: USER_SUMMARY,
    });
    const byId = new Map(users.map((u) => [u.id, u]));

    const viewer = await membershipOf(squad.id, req.user!.userId);

    return ok(res, {
      ...squad,
      // The join code is a credential. Returning it on a public squad page
      // would make it worthless, so only members ever see it.
      joinCode: viewer ? squad.joinCode : null,
      leader: byId.get(squad.leaderId) ?? null,
      viewerRole: viewer?.role ?? null,
      /// Sent so the client renders the same permission model the server
      /// enforces, rather than re-deriving it and drifting.
      can: viewer?.can ?? null,
      members: members
        .filter((m) => byId.has(m.userId))
        .map((m) => ({ ...m, user: byId.get(m.userId)! })),
    });
  } catch (error) {
    console.error('[squads/:id]', error);
    return fail(res, 500, 'Failed to load squad');
  }
});

/** POST /api/squads — creator becomes the leader. */
router.post('/', identify, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, visibility, college, meetingPoint, meetingAt } = req.body;

    const SQUAD_TYPES = ['study', 'travel', 'event', 'office', 'hostel', 'sports', 'general'];
    const type = SQUAD_TYPES.includes(String(req.body.type)) ? String(req.body.type) : 'general';
    const VISIBILITIES = ['public', 'private', 'invite'];
    const chosenVisibility = VISIBILITIES.includes(String(visibility))
      ? String(visibility)
      : 'public';

    const rawLimit = Number(req.body.memberLimit);
    const memberLimit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(Math.trunc(rawLimit), 2), 200)
      : null;

    if (typeof name !== 'string' || name.trim().length < 2) {
      return fail(res, 400, 'Squad name must be at least 2 characters');
    }

    // Rate limit: a burst of squads from one account is almost always abuse.
    const recent = await prisma.squad.count({
      where: {
        leaderId: req.user!.userId,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });
    if (recent >= 5) {
      return fail(res, 429, 'You have created too many squads in the last hour');
    }

    const squad = await prisma.squad.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        leaderId: req.user!.userId,
        type,
        visibility: chosenVisibility,
        // Every squad gets a code, including public ones — it is the fastest
        // way to pull somebody in who is standing next to you.
        joinCode: await allocateJoinCode(),
        status: 'active',
        memberLimit,
        themeColor:
          typeof req.body.themeColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(req.body.themeColor)
            ? req.body.themeColor
            : null,
        college: college || null,
        memberCount: 1,
        ...(meetingPoint
          ? {
              meetingPoint: {
                lat: Number(meetingPoint.lat),
                lng: Number(meetingPoint.lng),
                label: meetingPoint.label ?? null,
              },
              lat: Number(meetingPoint.lat),
              lng: Number(meetingPoint.lng),
            }
          : {}),
        ...(meetingAt ? { meetingAt: new Date(meetingAt) } : {}),
      },
    });

    await prisma.squadMember.create({
      data: { squadId: squad.id, userId: req.user!.userId, role: 'leader', status: 'active' },
    });

    return ok(res, squad, 201);
  } catch (error) {
    console.error('[squads POST]', error);
    return fail(res, 500, 'Failed to create squad');
  }
});

/** POST /api/squads/:id/join */
router.post('/:id/join', identify, async (req: AuthRequest, res: Response) => {
  try {
    const squad = await prisma.squad.findUnique({ where: { id: req.params.id } });
    if (!squad) return fail(res, 404, 'Squad not found');
    if (squad.visibility === 'private') {
      return fail(res, 403, 'This squad is invite only');
    }

    const existing = await prisma.squadMember.findUnique({
      where: { squadId_userId: { squadId: squad.id, userId: req.user!.userId } },
    });

    if (existing?.status === 'active') {
      return ok(res, { ...squad, viewerRole: existing.role });
    }

    if (existing) {
      await prisma.squadMember.update({
        where: { id: existing.id },
        data: { status: 'active' },
      });
    } else {
      await prisma.squadMember.create({
        data: { squadId: squad.id, userId: req.user!.userId, status: 'active' },
      });
    }

    const updated = await prisma.squad.update({
      where: { id: squad.id },
      data: { memberCount: { increment: 1 } },
    });

    const joiner = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { name: true },
    });

    await notify({
      userId: squad.leaderId,
      type: 'squad.joined',
      title: `${joiner?.name ?? 'Someone'} joined ${squad.name}`,
      body: `${updated.memberCount} members now.`,
      href: `/squads/${squad.id}`,
      data: { squadId: squad.id },
    });

    return ok(res, { ...updated, viewerRole: 'member' });
  } catch (error) {
    console.error('[squads/join]', error);
    return fail(res, 500, 'Failed to join squad');
  }
});

/** POST /api/squads/:id/leave */
router.post('/:id/leave', identify, async (req: AuthRequest, res: Response) => {
  try {
    const membership = await prisma.squadMember.findUnique({
      where: { squadId_userId: { squadId: req.params.id, userId: req.user!.userId } },
    });
    if (!membership || !ACTIVE_MEMBER_STATUSES.includes(membership.status as 'active')) {
      return fail(res, 404, 'You are not in this squad');
    }

    await prisma.squadMember.update({
      where: { id: membership.id },
      // Position goes with them. Someone who has left the squad must not leave
      // their last known location inside it.
      data: { status: 'left', lat: null, lng: null, locationAt: null },
    });
    await prisma.squad.update({
      where: { id: req.params.id },
      data: { memberCount: { decrement: 1 } },
    });

    // A squad whose leaderId points at someone who walked away has nobody who
    // can move the meeting point or admit anyone, which is a dead squad.
    const squad = await prisma.squad.findUnique({
      where: { id: req.params.id },
      select: { leaderId: true },
    });
    if (squad?.leaderId === req.user!.userId) {
      await transferLeadership(req.params.id, req.user!.userId);
    }

    getIO()?.to(`squad:${req.params.id}`).emit('squad:members-changed', {
      squadId: req.params.id,
    });

    return res.status(204).end();
  } catch (error) {
    console.error('[squads/leave]', error);
    return fail(res, 500, 'Failed to leave squad');
  }
});

/**
 * PATCH /api/squads/:id/meeting-point — LEADER ONLY.
 * This is the authorisation boundary the spec calls out explicitly: the client
 * also hides the control, but this check is what actually enforces it.
 */
router.patch('/:id/meeting-point', identify, async (req: AuthRequest, res: Response) => {
  try {
    const squad = await prisma.squad.findUnique({ where: { id: req.params.id } });
    if (!squad) return fail(res, 404, 'Squad not found');
    if (squad.leaderId !== req.user!.userId) {
      return fail(res, 403, 'Only the squad leader can move the meeting point');
    }

    const lat = Number(req.body.lat);
    const lng = Number(req.body.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return fail(res, 400, 'A valid latitude and longitude are required');
    }

    const updated = await prisma.squad.update({
      where: { id: squad.id },
      data: {
        meetingPoint: { lat, lng, label: req.body.label ?? null },
        lat,
        lng,
        ...(req.body.meetingAt ? { meetingAt: new Date(req.body.meetingAt) } : {}),
      },
    });

    // Push to everyone with the squad open so their map updates without a poll.
    getIO()?.to(`squad:${squad.id}`).emit('squad:meeting-point', {
      squadId: squad.id,
      lat,
      lng,
      label: req.body.label ?? null,
    });

    const members = await prisma.squadMember.findMany({
      where: { squadId: squad.id, status: 'active' },
      select: { userId: true },
    });

    await Promise.all(
      members
        .filter((m) => m.userId !== req.user!.userId)
        .map((m) =>
          notify({
            userId: m.userId,
            type: 'squad.meeting_point_updated',
            title: `${squad.name}: new meeting point`,
            body: req.body.label ?? 'The leader moved the meeting point.',
            href: `/squads/${squad.id}`,
            data: { squadId: squad.id },
          }),
        ),
    );

    return ok(res, updated);
  } catch (error) {
    console.error('[squads/meeting-point]', error);
    return fail(res, 500, 'Failed to update meeting point');
  }
});

export default router;
