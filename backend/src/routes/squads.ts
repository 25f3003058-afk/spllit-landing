import { Router, Response } from 'express';

import prisma from '../utils/prisma.js';
import { identify } from '../middleware/identity.js';
import { requireVerifiedInstitute } from '../middleware/institute.js';
import { AuthRequest } from '../types/express.js';
import { ok, fail, boundingBox, parseCoords } from '../utils/respond.js';
import { parseBody, geoPoint, text, isoDate } from '../utils/validate.js';
import { z } from 'zod';
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
  currentCommitment,
  SQUAD_ROLES,
  type SquadRole,
} from '../services/squads.js';

const router = Router();

/**
 * Squad creation contract.
 *
 * `study` and `hostel` are accepted but not offered by the create flow — they
 * predate the destination-first redesign and still exist on stored rows, so
 * rejecting them would break an edit of an old squad.
 */
const createSquadSchema = z.object({
  name: text(2, 80),
  description: text(0, 500).optional(),
  college: text(0, 120).optional(),
  type: z
    .enum([
      'exam', 'college', 'office', 'shopping', 'travel',
      'event', 'concert', 'sports', 'general', 'study', 'hostel',
    ])
    .default('general'),
  visibility: z.enum(['public', 'private', 'invite']).default('public'),
  // Clamped, not rejected: a client sending 500 means "no real limit".
  memberLimit: z.coerce.number().int().min(2).max(200).nullish(),
  destination: geoPoint.optional(),
  meetingPoint: geoPoint.optional(),
  meetingAt: isoDate.optional(),
  themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

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
    // Default widened from 10km: a campus network spans a city, and a 10km
    // circle around a hostel excludes the airport run people most want.
    const radiusKm = Math.min(Number(req.query.radiusKm) || 25, 50);
    const limit = Math.min(Number(req.query.limit) || 20, 60);

    const box = coords ? boundingBox(coords.lat, coords.lng, radiusKm) : null;

    /**
     * Squads the caller is already part of, so discovery can exclude them.
     *
     * "Squads near you" is a list of things to *join*. Showing your own squad
     * back to you is noise at best, and at worst reads as a duplicate of the
     * one already pinned at the top of the page. Your squads live under
     * /squads/mine.
     */
    const own = await prisma.squadMember.findMany({
      where: {
        userId: req.user!.userId,
        status: { in: [...ACTIVE_MEMBER_STATUSES, 'pending'] },
      },
      select: { squadId: true },
    });
    const ownIds = own.map((membership) => membership.squadId);

    const squads = await prisma.squad.findMany({
      where: {
        isActive: true,
        visibility: 'public',
        status: 'active',
        // Excludes squads you lead as well — the leader is always a member.
        ...(ownIds.length ? { id: { notIn: ownIds } } : {}),
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
    /**
     * Every active status, not the literal 'active'. A leader who starts
     * walking flips to `travelling` and used to vanish from their own squad
     * list — which also made the "one squad at a time" guard fail open, since
     * the client could no longer see the squad it was meant to block on.
     */
    const memberships = await prisma.squadMember.findMany({
      where: { userId: req.user!.userId, status: { in: [...ACTIVE_MEMBER_STATUSES] } },
      select: { squadId: true, role: true },
    });

    const squads = await prisma.squad.findMany({
      // Finished and cancelled squads are history, not "your squads".
      where: { id: { in: memberships.map((m) => m.squadId) }, status: 'active' },
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
      /**
       * Raw membership status, which `viewerRole` cannot express: a pending
       * request resolves to no role at all, so without this the client cannot
       * tell "never asked" from "waiting on the leader" and would offer the
       * join button to someone already in the queue.
       */
      viewerStatus: membership?.status ?? null,
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

/**
 * PATCH /api/squads/:id/status — end a squad.
 *
 * Leader-only, and the only way out of the one-squad-at-a-time rule: without
 * it a leader is committed forever and can neither start another nor join one.
 *
 * Terminal on purpose. Reopening a cancelled squad would resurrect a group
 * whose members have already been told it is over and have gone elsewhere;
 * starting a fresh one is both clearer and cheap.
 */
router.patch('/:id/status', identify, async (req: AuthRequest, res: Response) => {
  try {
    const next = String(req.body?.status ?? '');
    if (!['completed', 'cancelled'].includes(next)) {
      return fail(res, 400, 'Status must be completed or cancelled');
    }

    const squad = await prisma.squad.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, leaderId: true, status: true },
    });
    if (!squad) return fail(res, 404, 'Squad not found');

    // Authorisation, not presentation — the button is also hidden, but that is
    // not what stops anyone.
    const viewer = await membershipOf(squad.id, req.user!.userId);
    if (!viewer?.can.destroy) {
      return fail(res, 403, 'Only the leader can end this squad', 'forbidden');
    }

    if (squad.status !== 'active') {
      // Idempotent: a double-tap should not read as an error.
      return ok(res, { id: squad.id, status: squad.status });
    }

    const updated = await prisma.squad.update({
      where: { id: squad.id },
      data: { status: next, isActive: false },
    });

    /**
     * Members are released, not deleted. Their rows become `left`, which frees
     * them under the one-squad rule and clears the last position we held —
     * a squad that is over must not keep broadcasting where anyone was.
     */
    const members = await prisma.squadMember.findMany({
      where: { squadId: squad.id, status: { in: [...ACTIVE_MEMBER_STATUSES, 'pending'] } },
      select: { userId: true },
    });

    await prisma.squadMember.updateMany({
      where: { squadId: squad.id },
      data: { status: 'left', lat: null, lng: null, locationAt: null },
    });

    await Promise.all(
      members
        .filter((member) => member.userId !== req.user!.userId)
        .map((member) =>
          notify({
            userId: member.userId,
            type: 'squad.joined',
            title:
              next === 'cancelled'
                ? `${squad.name} was cancelled`
                : `${squad.name} has finished`,
            body:
              next === 'cancelled'
                ? 'The leader called it off. You can join another squad now.'
                : 'Thanks for travelling together.',
            href: '/squads',
            data: { squadId: squad.id },
          }),
        ),
    );

    getIO()?.to(`squad:${squad.id}`).emit('squad:members-changed', { squadId: squad.id });

    return ok(res, { id: updated.id, status: updated.status });
  } catch (error) {
    console.error('[squads/:id/status]', error);
    return fail(res, 500, 'Failed to update the squad');
  }
});

/** POST /api/squads — creator becomes the leader. */
router.post('/', identify, requireVerifiedInstitute, async (req: AuthRequest, res: Response) => {
  try {
    /**
     * Validated rather than coerced.
     *
     * This block previously read the body by hand — String(), Number(), a
     * length check on the name and nothing else. A 5MB description or a
     * latitude of 900 was accepted and stored; every downstream reader then had
     * to cope. The schema states the contract once, at the boundary.
     */
    const body = parseBody(createSquadSchema, req.body, res);
    if (!body) return;

    const {
      name,
      description,
      college,
      meetingAt,
      type,
      visibility: chosenVisibility,
      memberLimit,
    } = body;

    const resolvedDestination = body.destination ?? null;
    const meetingPoint = body.meetingPoint ?? null;

    /**
     * A squad exists so that people meet, so it must never be stored without a
     * meeting point — "somewhere at the destination" is not a place anyone can
     * walk to. When the leader skips the picker we fall back to the destination
     * itself, which is always somewhere real, rather than leaving null.
     *
     * Only defaulted when a destination exists: clients that predate the
     * destination-first flow still post neither, and rejecting them would break
     * squad creation for anything not on this web build.
     */
    /**
     * Normalised to the shape Prisma's embedded GeoPoint expects: it takes
     * `string | null`, while the schema leaves optional strings `undefined`.
     */
    const toStored = (point: z.infer<typeof geoPoint>) => ({
      lat: Number(point.lat),
      lng: Number(point.lng),
      label: point.label ?? null,
      address: point.address ?? null,
    });

    const storedDestination = resolvedDestination ? toStored(resolvedDestination) : null;

    const resolvedMeetingPoint = meetingPoint
      ? toStored(meetingPoint)
      : storedDestination
        ? {
            ...storedDestination,
            label: storedDestination.label ? `At ${storedDestination.label}` : null,
          }
        : null;

    /**
     * One live squad per leader.
     *
     * This replaces a "five per hour" counter, which allowed exactly the mess
     * it was meant to stop: five near-identical squads to the same place, each
     * splitting the people who might otherwise have travelled together. A
     * network like this fails by fragmenting, not by volume.
     *
     * Scoped to squads still running. Completing or cancelling frees the slot
     * immediately, so this is a concurrency limit rather than a quota.
     */
    const live = await prisma.squad.findFirst({
      where: {
        leaderId: req.user!.userId,
        status: 'active',
        isActive: true,
      },
      select: { id: true, name: true, destination: true },
    });

    if (live) {
      return fail(
        res,
        409,
        `You already lead "${live.name}". Finish or cancel it before starting another.`,
        'squad-already-active',
      );
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
        memberLimit: memberLimit ?? null,
        themeColor: body.themeColor ?? null,
        college: college || null,
        memberCount: 1,
        ...(storedDestination ? { destination: storedDestination } : {}),
        ...(resolvedMeetingPoint ? { meetingPoint: resolvedMeetingPoint } : {}),
        /**
         * Map position for clustering and /nearby is *always* the meeting
         * point. People travel to where the squad gathers, not to the middle of
         * the destination — a marker on Phoenix Mall when everyone is meeting at
         * Gate 2 sends them to the wrong place.
         */
        ...(resolvedMeetingPoint
          ? { lat: resolvedMeetingPoint.lat, lng: resolvedMeetingPoint.lng }
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
router.post('/:id/join', identify, requireVerifiedInstitute, async (req: AuthRequest, res: Response) => {
  try {
    const squad = await prisma.squad.findUnique({ where: { id: req.params.id } });
    if (!squad) return fail(res, 404, 'Squad not found');
    if (squad.visibility === 'private') {
      return fail(res, 403, 'This squad is invite only');
    }

    /**
     * One squad at a time. Checked before anything is written so a second
     * pending request cannot be queued behind the first.
     */
    const commitment = await currentCommitment(req.user!.userId);
    if (commitment && commitment.squad.id !== squad.id) {
      const where =
        commitment.squad.destination?.label?.split(',')[0] ?? commitment.squad.name;
      return fail(
        res,
        409,
        commitment.role === 'leader'
          ? `You lead a squad to ${where}. Cancel it before joining another.`
          : `You are already in a squad to ${where}. Leave it before joining another.`,
        'already-in-squad',
      );
    }

    const existing = await prisma.squadMember.findUnique({
      where: { squadId_userId: { squadId: squad.id, userId: req.user!.userId } },
    });

    if (existing?.status === 'active') {
      return ok(res, { ...squad, viewerRole: existing.role, viewerStatus: 'active' });
    }

    // Idempotent: tapping Join twice must not queue two requests or renotify.
    if (existing?.status === 'pending') {
      return ok(res, { ...squad, viewerRole: null, viewerStatus: 'pending' });
    }

    /**
     * Capacity is checked here *and* again at approval. Here so nobody queues
     * behind a squad that is already full; again at approval because the squad
     * can fill while a request sits waiting.
     */
    if (squad.memberLimit !== null && squad.memberCount >= squad.memberLimit) {
      return fail(res, 409, 'This squad is full', 'squad-full');
    }

    /**
     * Joining is a *request*, not an admission — the leader decides. The
     * pending row is what /requests lists and what the approve handler flips to
     * active; memberCount is deliberately not incremented until then, so a
     * queue of hopefuls cannot make a squad look full.
     */
    if (existing) {
      await prisma.squadMember.update({
        where: { id: existing.id },
        data: { status: 'pending', role: 'member' },
      });
    } else {
      await prisma.squadMember.create({
        data: { squadId: squad.id, userId: req.user!.userId, status: 'pending' },
      });
    }

    const joiner = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { name: true },
    });

    await notify({
      userId: squad.leaderId,
      type: 'squad.join_requested',
      title: `${joiner?.name ?? 'Someone'} wants to join ${squad.name}`,
      body: 'Review the request to let them in.',
      href: `/squads/${squad.id}`,
      data: { squadId: squad.id },
    });

    getIO()?.to(`squad:${squad.id}`).emit('squad:members-changed', { squadId: squad.id });

    return ok(res, { ...squad, viewerRole: null, viewerStatus: 'pending' });
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
