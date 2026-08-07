import { Router, Response } from 'express';

import prisma from '../utils/prisma.js';
import { identify } from '../middleware/identity.js';
import { AuthRequest } from '../types/express.js';
import { ok, fail } from '../utils/respond.js';
import { resolveThread } from '../services/threads.js';

const router = Router();

/** Channels every new community starts with, in display order. */
const DEFAULT_CHANNELS = [
  { slug: 'general', name: 'general' },
  { slug: 'placements', name: 'placements' },
  { slug: 'internships', name: 'internships' },
  { slug: 'events', name: 'events' },
  { slug: 'marketplace', name: 'marketplace' },
];

/** GET /api/communities/discover */
router.get('/discover', identify, async (req: AuthRequest, res: Response) => {
  try {
    const college = req.query.college ? String(req.query.college) : null;

    const communities = await prisma.community.findMany({
      where: {
        OR: [
          { visibility: 'public' },
          ...(college ? [{ visibility: 'college-only', college }] : []),
        ],
      },
      // Biggest first: an empty community is a worse first impression than a
      // busy one the user might not have heard of.
      orderBy: { memberCount: 'desc' },
      take: Math.min(Number(req.query.limit) || 20, 50),
    });

    const mine = await prisma.communityMember.findMany({
      where: {
        userId: req.user!.userId,
        communityId: { in: communities.map((c) => c.id) },
      },
      select: { communityId: true },
    });
    const joined = new Set(mine.map((m) => m.communityId));

    return ok(res, {
      items: communities.map((c) => ({ ...c, viewerIsMember: joined.has(c.id) })),
      nextCursor: null,
    });
  } catch (error) {
    console.error('[communities/discover]', error);
    return fail(res, 500, 'Failed to load communities');
  }
});

/** GET /api/communities/mine */
router.get('/mine', identify, async (req: AuthRequest, res: Response) => {
  try {
    const memberships = await prisma.communityMember.findMany({
      where: { userId: req.user!.userId },
      select: { communityId: true },
    });

    const communities = await prisma.community.findMany({
      where: { id: { in: memberships.map((m) => m.communityId) } },
      orderBy: { name: 'asc' },
    });

    return ok(
      res,
      communities.map((c) => ({ ...c, viewerIsMember: true })),
    );
  } catch (error) {
    console.error('[communities/mine]', error);
    return fail(res, 500, 'Failed to load your communities');
  }
});

/** GET /api/communities/:id — includes channels with per-user unread counts. */
router.get('/:id', identify, async (req: AuthRequest, res: Response) => {
  try {
    const community = await prisma.community.findUnique({ where: { id: req.params.id } });
    if (!community) return fail(res, 404, 'Community not found');

    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: { communityId: community.id, userId: req.user!.userId },
      },
    });

    if (community.visibility === 'private' && !membership) {
      return fail(res, 403, 'This community is private');
    }

    const channels = await prisma.channel.findMany({
      where: { communityId: community.id },
      orderBy: { position: 'asc' },
    });

    // Unread is derived from the channel's thread, so it stays consistent with
    // what the chat surface actually shows.
    const threads = await prisma.chatThread.findMany({
      where: { contextType: 'channel', contextId: { in: channels.map((c) => c.id) } },
      select: { id: true, contextId: true },
    });
    const threadByChannel = new Map(threads.map((t) => [t.contextId, t.id]));

    const readStates = await prisma.threadReadState.findMany({
      where: { threadId: { in: threads.map((t) => t.id) }, userId: req.user!.userId },
    });
    const readAt = new Map(readStates.map((r) => [r.threadId, r.lastReadAt]));

    const withUnread = await Promise.all(
      channels.map(async (channel) => {
        const threadId = threadByChannel.get(channel.id);
        if (!threadId || !membership) return { ...channel, unreadCount: 0 };
        const since = readAt.get(threadId);
        const unreadCount = await prisma.threadMessage.count({
          where: {
            threadId,
            isDeleted: false,
            senderId: { not: req.user!.userId },
            ...(since ? { createdAt: { gt: since } } : {}),
          },
        });
        return { ...channel, unreadCount };
      }),
    );

    return ok(res, {
      ...community,
      channels: withUnread,
      viewerIsMember: Boolean(membership),
    });
  } catch (error) {
    console.error('[communities/:id]', error);
    return fail(res, 500, 'Failed to load community');
  }
});

router.get('/:id/channels', identify, async (req: AuthRequest, res: Response) => {
  try {
    const channels = await prisma.channel.findMany({
      where: { communityId: req.params.id },
      orderBy: { position: 'asc' },
    });
    return ok(res, channels);
  } catch (error) {
    console.error('[communities/channels]', error);
    return fail(res, 500, 'Failed to load channels');
  }
});

/** POST /api/communities — creator becomes owner; default channels are seeded. */
router.post('/', identify, async (req: AuthRequest, res: Response) => {
  try {
    const name = String(req.body.name ?? '').trim();
    if (name.length < 3) return fail(res, 400, 'Name must be at least 3 characters');

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const clash = await prisma.community.findUnique({ where: { slug } });
    if (clash) return fail(res, 409, 'A community with that name already exists');

    const community = await prisma.community.create({
      data: {
        name,
        slug,
        description: req.body.description?.trim() || null,
        college: req.body.college || null,
        visibility: ['public', 'college-only', 'private'].includes(req.body.visibility)
          ? req.body.visibility
          : 'public',
        ownerId: req.user!.userId,
        memberCount: 1,
      },
    });

    await prisma.channel.createMany({
      data: DEFAULT_CHANNELS.map((channel, index) => ({
        communityId: community.id,
        slug: channel.slug,
        name: channel.name,
        position: index,
      })),
    });

    await prisma.communityMember.create({
      data: { communityId: community.id, userId: req.user!.userId, role: 'owner' },
    });

    return ok(res, community, 201);
  } catch (error) {
    console.error('[communities POST]', error);
    return fail(res, 500, 'Failed to create community');
  }
});

router.post('/:id/join', identify, async (req: AuthRequest, res: Response) => {
  try {
    const community = await prisma.community.findUnique({ where: { id: req.params.id } });
    if (!community) return fail(res, 404, 'Community not found');
    if (community.visibility === 'private') {
      return fail(res, 403, 'This community is invite only');
    }

    const existing = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: { communityId: community.id, userId: req.user!.userId },
      },
    });
    if (existing) return ok(res, { ...community, viewerIsMember: true });

    await prisma.communityMember.create({
      data: { communityId: community.id, userId: req.user!.userId },
    });
    const updated = await prisma.community.update({
      where: { id: community.id },
      data: { memberCount: { increment: 1 } },
    });

    // Seed the member into every channel thread so their first visit shows
    // history rather than an empty room.
    const channels = await prisma.channel.findMany({
      where: { communityId: community.id },
      select: { id: true },
    });
    await Promise.all(
      channels.map((channel) => resolveThread('channel', channel.id, req.user!.userId)),
    );

    return ok(res, { ...updated, viewerIsMember: true });
  } catch (error) {
    console.error('[communities/join]', error);
    return fail(res, 500, 'Failed to join community');
  }
});

router.post('/:id/leave', identify, async (req: AuthRequest, res: Response) => {
  try {
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: { communityId: req.params.id, userId: req.user!.userId },
      },
    });
    if (!membership) return fail(res, 404, 'You are not in this community');
    if (membership.role === 'owner') {
      return fail(res, 400, 'Transfer ownership before leaving');
    }

    await prisma.communityMember.delete({ where: { id: membership.id } });
    await prisma.community.update({
      where: { id: req.params.id },
      data: { memberCount: { decrement: 1 } },
    });

    return res.status(204).end();
  } catch (error) {
    console.error('[communities/leave]', error);
    return fail(res, 500, 'Failed to leave community');
  }
});

export default router;
