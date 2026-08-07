import prisma from '../utils/prisma.js';
import { ACTIVE_MEMBER_STATUSES } from './squads.js';

/**
 * Thread resolution. A conversation is identified by what it is attached to,
 * not by an id the client has to remember — so opening chat from a ride card,
 * a squad page or a profile all land in the right place without the caller
 * knowing whether the thread already exists.
 */

export type ContextType = 'squad' | 'ride' | 'channel' | 'dm';

/** DM context ids are the two uids sorted, so both directions resolve equal. */
export function dmContextId(a: string, b: string): string {
  return [a, b].sort().join(':');
}

interface Resolved {
  title: string;
  imageUrl: string | null;
  participantIds: string[];
}

/**
 * Derives a thread's identity and membership from the thing it hangs off.
 * Returns null when the caller has no business being in that conversation —
 * this is the authorisation check for chat.
 */
async function describe(
  contextType: ContextType,
  contextId: string,
  userId: string,
): Promise<Resolved | null> {
  if (contextType === 'squad') {
    const squad = await prisma.squad.findUnique({ where: { id: contextId } });
    if (!squad) return null;
    /**
     * Every *active* status, not just 'active'.
     *
     * `travelling` and `arrived` are journey states, not membership states — a
     * member walking to the meeting point is still in the squad. Matching on
     * the literal 'active' silently ejected people from the group chat the
     * moment they started moving, which is precisely when they need it.
     */
    const members = await prisma.squadMember.findMany({
      where: { squadId: contextId, status: { in: [...ACTIVE_MEMBER_STATUSES] } },
      select: { userId: true, feePaid: true, role: true },
    });

    /**
     * Chat is what the join fee buys, so an approved-but-unpaid member is not
     * in the conversation yet.
     *
     * The leader is exempt: they created the squad and were never charged, so
     * gating them out of their own group chat would be absurd.
     */
    const viewer = members.find((member) => member.userId === userId);
    if (!viewer) return null;
    if (viewer.role !== 'leader' && !viewer.feePaid) return null;

    // Participants are the people who can actually be in it.
    const ids = members
      .filter((member) => member.role === 'leader' || member.feePaid)
      .map((member) => member.userId);
    return { title: squad.name, imageUrl: squad.imageUrl, participantIds: ids };
  }

  if (contextType === 'ride') {
    const ride = await prisma.ride.findUnique({ where: { id: contextId } });
    if (!ride) return null;
    const matches = await prisma.match.findMany({
      where: { rideId: contextId, status: { in: ['pending', 'accepted'] } },
      select: { user2Id: true },
    });
    const ids = [ride.userId, ...matches.map((m) => m.user2Id)];
    if (!ids.includes(userId)) return null;
    return {
      title: `${ride.origin} → ${ride.destination}`,
      imageUrl: null,
      participantIds: [...new Set(ids)],
    };
  }

  if (contextType === 'channel') {
    const channel = await prisma.channel.findUnique({ where: { id: contextId } });
    if (!channel) return null;
    const members = await prisma.communityMember.findMany({
      where: { communityId: channel.communityId },
      select: { userId: true },
    });
    const ids = members.map((m) => m.userId);
    if (!ids.includes(userId)) return null;
    return { title: `#${channel.name}`, imageUrl: null, participantIds: ids };
  }

  // DM: contextId is the other user's id on first open, or the sorted pair.
  const otherId = contextId.includes(':')
    ? contextId.split(':').find((id) => id !== userId)
    : contextId;
  if (!otherId || otherId === userId) return null;

  const other = await prisma.user.findUnique({
    where: { id: otherId },
    select: { id: true, name: true, profilePhoto: true },
  });
  if (!other) return null;

  // Blocked in either direction means no thread.
  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: otherId },
        { blockerId: otherId, blockedId: userId },
      ],
    },
    select: { id: true },
  });
  if (blocked) return null;

  return {
    title: other.name,
    imageUrl: other.profilePhoto,
    participantIds: [userId, other.id],
  };
}

export async function resolveThread(
  contextType: ContextType,
  rawContextId: string,
  userId: string,
) {
  const described = await describe(contextType, rawContextId, userId);
  if (!described) return null;

  const contextId =
    contextType === 'dm'
      ? dmContextId(userId, described.participantIds.find((id) => id !== userId)!)
      : rawContextId;

  const existing = await prisma.chatThread.findUnique({
    where: { contextType_contextId: { contextType, contextId } },
  });

  if (existing) {
    // Membership can change after creation (someone joins a squad); keep the
    // denormalised participant list honest on every resolve.
    const changed =
      existing.participantIds.length !== described.participantIds.length ||
      described.participantIds.some((id) => !existing.participantIds.includes(id));

    if (changed || existing.title !== described.title) {
      return prisma.chatThread.update({
        where: { id: existing.id },
        data: { participantIds: described.participantIds, title: described.title },
      });
    }
    return existing;
  }

  return prisma.chatThread.create({
    data: {
      contextType,
      contextId,
      title: described.title,
      imageUrl: described.imageUrl,
      participantIds: described.participantIds,
    },
  });
}

/** True when the user is listed on the thread. Cheap membership check. */
export async function canAccessThread(threadId: string, userId: string) {
  const thread = await prisma.chatThread.findUnique({ where: { id: threadId } });
  if (!thread || !thread.participantIds.includes(userId)) return null;
  return thread;
}
