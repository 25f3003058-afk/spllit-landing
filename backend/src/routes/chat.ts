import { Router, Response } from 'express';

import prisma from '../utils/prisma.js';
import { identify } from '../middleware/identity.js';
import { AuthRequest } from '../types/express.js';
import { ok, fail } from '../utils/respond.js';
import { canAccessThread, resolveThread, type ContextType } from '../services/threads.js';
import { getIO } from '../services/live.js';
import { notify } from '../services/notifications.js';

const router = Router();

const USER_SUMMARY = {
  id: true,
  name: true,
  username: true,
  profilePhoto: true,
  college: true,
} as const;

const CONTEXTS: ContextType[] = ['squad', 'ride', 'channel', 'dm'];

async function withSenders(messages: { senderId: string }[]) {
  const users = await prisma.user.findMany({
    where: { id: { in: [...new Set(messages.map((m) => m.senderId))] } },
    select: USER_SUMMARY,
  });
  return new Map(users.map((u) => [u.id, u]));
}

/** GET /api/chat/threads — every conversation the caller is part of. */
router.get('/threads', identify, async (req: AuthRequest, res: Response) => {
  try {
    const threads = await prisma.chatThread.findMany({
      where: { participantIds: { has: req.user!.userId } },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    const [lastMessages, readStates] = await Promise.all([
      prisma.threadMessage.findMany({
        where: { threadId: { in: threads.map((t) => t.id) }, isDeleted: false },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.threadReadState.findMany({
        where: { threadId: { in: threads.map((t) => t.id) }, userId: req.user!.userId },
      }),
    ]);

    // First message seen per thread wins — the list is already newest-first.
    const latest = new Map<string, (typeof lastMessages)[number]>();
    for (const message of lastMessages) {
      if (!latest.has(message.threadId)) latest.set(message.threadId, message);
    }

    const readAt = new Map(readStates.map((r) => [r.threadId, r.lastReadAt]));
    const senders = await withSenders([...latest.values()]);

    const participants = await prisma.user.findMany({
      where: { id: { in: [...new Set(threads.flatMap((t) => t.participantIds))] } },
      select: USER_SUMMARY,
    });
    const byId = new Map(participants.map((p) => [p.id, p]));

    const items = await Promise.all(
      threads.map(async (thread) => {
        const since = readAt.get(thread.id);
        const unreadCount = await prisma.threadMessage.count({
          where: {
            threadId: thread.id,
            isDeleted: false,
            senderId: { not: req.user!.userId },
            ...(since ? { createdAt: { gt: since } } : {}),
          },
        });

        const last = latest.get(thread.id);
        return {
          ...thread,
          unreadCount,
          participants: thread.participantIds
            .map((id) => byId.get(id))
            .filter((u): u is NonNullable<typeof u> => Boolean(u)),
          lastMessage: last
            ? { ...last, sender: senders.get(last.senderId) ?? null }
            : null,
        };
      }),
    );

    return ok(res, items);
  } catch (error) {
    console.error('[chat/threads]', error);
    return fail(res, 500, 'Failed to load conversations');
  }
});

/** POST /api/chat/threads/resolve — find or create the thread for a context. */
router.post('/threads/resolve', identify, async (req: AuthRequest, res: Response) => {
  try {
    const contextType = String(req.body.contextType) as ContextType;
    const contextId = String(req.body.contextId ?? '');

    if (!CONTEXTS.includes(contextType) || !contextId) {
      return fail(res, 400, 'A valid chat context is required');
    }

    const thread = await resolveThread(contextType, contextId, req.user!.userId);
    if (!thread) {
      return fail(res, 403, 'You do not have access to this conversation');
    }

    const participants = await prisma.user.findMany({
      where: { id: { in: thread.participantIds } },
      select: USER_SUMMARY,
    });

    return ok(res, { ...thread, participants, unreadCount: 0, lastMessage: null });
  } catch (error) {
    console.error('[chat/threads/resolve]', error);
    return fail(res, 500, 'Failed to open the conversation');
  }
});

router.get('/threads/:id', identify, async (req: AuthRequest, res: Response) => {
  try {
    const thread = await canAccessThread(req.params.id, req.user!.userId);
    if (!thread) return fail(res, 404, 'Conversation not found');

    const participants = await prisma.user.findMany({
      where: { id: { in: thread.participantIds } },
      select: USER_SUMMARY,
    });

    return ok(res, { ...thread, participants, unreadCount: 0, lastMessage: null });
  } catch (error) {
    console.error('[chat/threads/:id]', error);
    return fail(res, 500, 'Failed to load the conversation');
  }
});

/** GET /api/chat/threads/:id/messages — newest first, cursor walks backwards. */
router.get('/threads/:id/messages', identify, async (req: AuthRequest, res: Response) => {
  try {
    const thread = await canAccessThread(req.params.id, req.user!.userId);
    if (!thread) return fail(res, 404, 'Conversation not found');

    const limit = Math.min(Number(req.query.limit) || 40, 100);
    const cursor = req.query.cursor ? new Date(String(req.query.cursor)) : null;

    const messages = await prisma.threadMessage.findMany({
      where: {
        threadId: thread.id,
        isDeleted: false,
        ...(cursor ? { createdAt: { lt: cursor } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const senders = await withSenders(messages);

    return ok(res, {
      items: messages.map((m) => ({ ...m, sender: senders.get(m.senderId) ?? null })),
      nextCursor:
        messages.length === limit
          ? (messages[messages.length - 1]?.createdAt.toISOString() ?? null)
          : null,
    });
  } catch (error) {
    console.error('[chat/messages GET]', error);
    return fail(res, 500, 'Failed to load messages');
  }
});

/**
 * POST /api/chat/threads/:id/messages
 * HTTP send path. The socket path is preferred, but this exists so a message
 * is never silently lost when the socket is down.
 */
router.post('/threads/:id/messages', identify, async (req: AuthRequest, res: Response) => {
  try {
    const thread = await canAccessThread(req.params.id, req.user!.userId);
    if (!thread) return fail(res, 404, 'Conversation not found');

    const content = String(req.body.content ?? '').trim();
    if (!content) return fail(res, 400, 'Message cannot be empty');
    if (content.length > 4000) return fail(res, 400, 'Message is too long');

    const message = await prisma.threadMessage.create({
      data: {
        threadId: thread.id,
        senderId: req.user!.userId,
        content,
        type: typeof req.body.type === 'string' ? req.body.type : 'text',
        metadata: (req.body.metadata ?? null) as never,
      },
    });

    await prisma.chatThread.update({
      where: { id: thread.id },
      data: { lastMessageAt: message.createdAt },
    });

    const sender = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: USER_SUMMARY,
    });

    const payload = { ...message, sender };
    getIO()?.to(`thread:${thread.id}`).emit('chat:message', payload);

    // Notify participants who are not in the room. Channels are excluded —
    // a busy channel would otherwise generate a notification per message.
    if (thread.contextType !== 'channel') {
      await Promise.all(
        thread.participantIds
          .filter((id) => id !== req.user!.userId)
          .map((userId) =>
            notify({
              userId,
              type: 'chat.message',
              title: thread.title,
              body: content.slice(0, 140),
              href: `/chat/${thread.id}`,
              data: { threadId: thread.id },
            }),
          ),
      );
    }

    return ok(res, payload, 201);
  } catch (error) {
    console.error('[chat/messages POST]', error);
    return fail(res, 500, 'Failed to send the message');
  }
});

router.post('/threads/:id/read', identify, async (req: AuthRequest, res: Response) => {
  try {
    const thread = await canAccessThread(req.params.id, req.user!.userId);
    if (!thread) return fail(res, 404, 'Conversation not found');

    await prisma.threadReadState.upsert({
      where: { threadId_userId: { threadId: thread.id, userId: req.user!.userId } },
      create: { threadId: thread.id, userId: req.user!.userId },
      update: { lastReadAt: new Date() },
    });

    return res.status(204).end();
  } catch (error) {
    console.error('[chat/read]', error);
    return fail(res, 500, 'Failed to mark as read');
  }
});

export default router;
