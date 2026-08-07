import prisma from '../utils/prisma.js';
import { calculateDistanceMetres } from '../utils/helpers.js';
import { getRoute } from '../services/directions.js';
import { notify } from '../services/notifications.js';
import { getIO } from '../services/live.js';

/**
 * Squad roles, capabilities and journey state.
 *
 * Capability lives here and nowhere else. Re-deriving "can this person change
 * the meeting point" inside each handler is how one route ends up letting a
 * guest do something every other route forbids — every squad handler asks this
 * module instead.
 */

export type SquadRole = 'leader' | 'co-leader' | 'member' | 'guest';

export const SQUAD_ROLES: SquadRole[] = ['leader', 'co-leader', 'member', 'guest'];

export interface SquadCapabilities {
  /** Read the squad, its members and its map. */
  view: boolean;
  /** Post in squad chat. */
  chat: boolean;
  /** Broadcast position and be routed to the meeting point. */
  shareLocation: boolean;
  /** Move the meeting point or destination. */
  setMeetingPoint: boolean;
  /** Approve or reject join requests. */
  admitMembers: boolean;
  /** Remove a member, or change their role. */
  manageMembers: boolean;
  /** Promote to co-leader, demote, hand over leadership. */
  assignRoles: boolean;
  /** Cancel or delete the squad. */
  destroy: boolean;
}

const CAPABILITIES: Record<SquadRole, SquadCapabilities> = {
  leader: {
    view: true,
    chat: true,
    shareLocation: true,
    setMeetingPoint: true,
    admitMembers: true,
    manageMembers: true,
    assignRoles: true,
    destroy: true,
  },
  // Everything except ending the squad — a co-leader is there to run the day,
  // not to be able to delete it out from under the person who started it.
  'co-leader': {
    view: true,
    chat: true,
    shareLocation: true,
    setMeetingPoint: true,
    admitMembers: true,
    manageMembers: true,
    assignRoles: false,
    destroy: false,
  },
  member: {
    view: true,
    chat: true,
    shareLocation: true,
    setMeetingPoint: false,
    admitMembers: false,
    manageMembers: false,
    assignRoles: false,
    destroy: false,
  },
  // View and navigate only. A guest is someone tagging along who has not been
  // vouched for — they can find the group, not steer it.
  guest: {
    view: true,
    chat: false,
    shareLocation: true,
    setMeetingPoint: false,
    admitMembers: false,
    manageMembers: false,
    assignRoles: false,
    destroy: false,
  },
};

export function capabilitiesFor(role: SquadRole): SquadCapabilities {
  return CAPABILITIES[role];
}

/** Statuses that mean "in the squad", as opposed to requested or departed. */
export const ACTIVE_MEMBER_STATUSES = ['active', 'travelling', 'arrived'] as const;

export interface SquadMembership {
  memberId: string;
  role: SquadRole;
  status: string;
  can: SquadCapabilities;
}

/**
 * Resolves what a user may do in a squad. Returns null when they are not a
 * member — callers must treat that as "cannot see it", not as "no permissions".
 */
export async function membershipOf(
  squadId: string,
  userId: string,
): Promise<SquadMembership | null> {
  const member = await prisma.squadMember.findUnique({
    where: { squadId_userId: { squadId, userId } },
    select: { id: true, role: true, status: true },
  });

  if (!member) return null;
  // A pending request or a departed member has no capabilities at all; they
  // simply are not in the squad yet, or any more.
  if (!ACTIVE_MEMBER_STATUSES.includes(member.status as 'active')) return null;

  const role = (SQUAD_ROLES.includes(member.role as SquadRole) ? member.role : 'member') as SquadRole;
  return { memberId: member.id, role, status: member.status, can: capabilitiesFor(role) };
}

/**
 * Join codes.
 *
 * Read aloud across a room, so for each pair people mishear or mistype only
 * one character survives: O and 0 both go (0 is also lost to the digit run
 * starting at 2), I and 1 both go, and S goes while 5 stays. Six characters
 * over 31 symbols is ~10^9 combinations — plenty for concurrently-open squads,
 * and still short enough to dictate.
 */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRTUVWXYZ23456789';

export function generateJoinCode(): string {
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

/** Allocates a code that no active squad already holds. */
export async function allocateJoinCode(): Promise<string> {
  // Bounded rather than a while(true): at this alphabet size a collision is
  // vanishingly rare, and a runaway loop under an exhausted keyspace would
  // hang the request instead of failing it.
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateJoinCode();
    const taken = await prisma.squad.findFirst({
      where: { joinCode: code, status: 'active' },
      select: { id: true },
    });
    if (!taken) return code;
  }
  throw new Error('Could not allocate a unique join code');
}

/** Metres within which someone counts as having arrived. */
export const ARRIVAL_RADIUS_METRES = 20;

export interface MemberProgress {
  distanceMetres: number | null;
  etaSeconds: number | null;
  arrived: boolean;
}

/**
 * Distance and ETA from a member to the meeting point.
 *
 * Straight-line distance is computed always; a Directions call is only made
 * when the member is far enough away for the road route to differ meaningfully
 * from the crow flight. Inside the arrival radius the answer is "you are here"
 * and a routing request would be pure spend.
 */
export async function progressToMeetingPoint(
  member: { lat: number | null; lng: number | null },
  meeting: { lat: number; lng: number },
): Promise<MemberProgress> {
  if (member.lat === null || member.lng === null) {
    return { distanceMetres: null, etaSeconds: null, arrived: false };
  }

  const distanceMetres = Math.round(
    calculateDistanceMetres(member.lat, member.lng, meeting.lat, meeting.lng),
  );

  if (distanceMetres <= ARRIVAL_RADIUS_METRES) {
    return { distanceMetres, etaSeconds: 0, arrived: true };
  }

  // Walking, because the last leg to a meeting point is on foot even when the
  // journey to it was not.
  const route = await getRoute(
    [member.lng, member.lat],
    [meeting.lng, meeting.lat],
    'walking',
  );

  return {
    distanceMetres: route ? Math.round(route.distanceMetres) : distanceMetres,
    etaSeconds: route ? Math.round(route.durationSeconds) : null,
    arrived: false,
  };
}

/**
 * Records a member's position and, if they have reached the meeting point,
 * flips them to `arrived` exactly once.
 *
 * Arrival is detected server-side from the reported position rather than being
 * a button the member presses: the leader is relying on it to know whether to
 * wait, and self-declared arrival is the first thing anyone would fake.
 */
export async function recordPosition(input: {
  squadId: string;
  userId: string;
  lat: number;
  lng: number;
  battery?: number | null;
  network?: string | null;
}): Promise<{ arrived: boolean; distanceMetres: number | null }> {
  const squad = await prisma.squad.findUnique({
    where: { id: input.squadId },
    select: { id: true, name: true, leaderId: true, meetingPoint: true, status: true },
  });
  if (!squad || squad.status !== 'active') {
    return { arrived: false, distanceMetres: null };
  }

  const member = await prisma.squadMember.findUnique({
    where: { squadId_userId: { squadId: input.squadId, userId: input.userId } },
    select: { id: true, status: true, arrivedAt: true },
  });
  if (!member || !ACTIVE_MEMBER_STATUSES.includes(member.status as 'active')) {
    return { arrived: false, distanceMetres: null };
  }

  const meeting = squad.meetingPoint as { lat?: number; lng?: number } | null;
  const hasMeeting = Number.isFinite(meeting?.lat) && Number.isFinite(meeting?.lng);

  const distanceMetres = hasMeeting
    ? Math.round(
        calculateDistanceMetres(input.lat, input.lng, meeting!.lat as number, meeting!.lng as number),
      )
    : null;

  const nowArrived =
    distanceMetres !== null &&
    distanceMetres <= ARRIVAL_RADIUS_METRES &&
    member.status !== 'arrived';

  await prisma.squadMember.update({
    where: { id: member.id },
    data: {
      lat: input.lat,
      lng: input.lng,
      locationAt: new Date(),
      ...(input.battery !== undefined ? { battery: input.battery } : {}),
      ...(input.network !== undefined ? { network: input.network } : {}),
      ...(nowArrived ? { status: 'arrived', arrivedAt: new Date() } : {}),
      // Moving away again reopens the journey, but never clears arrivedAt —
      // "was here at 6:02" stays true even if they stepped out for coffee.
      ...(member.status === 'active' && !nowArrived && distanceMetres !== null
        ? { status: 'travelling' }
        : {}),
    },
  });

  const io = getIO();
  io?.to(`squad:${squad.id}`).emit('squad:member-position', {
    squadId: squad.id,
    userId: input.userId,
    lat: input.lat,
    lng: input.lng,
    distanceMetres,
    arrived: nowArrived || member.status === 'arrived',
    updatedAt: Date.now(),
  });

  if (nowArrived) {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { name: true },
    });

    // The leader is the one waiting, so they are the one told. Telling the
    // whole squad about every arrival turns into spam in a group of ten.
    if (squad.leaderId !== input.userId) {
      await notify({
        userId: squad.leaderId,
        type: 'squad.joined',
        title: `${user?.name ?? 'A member'} arrived`,
        body: `They reached the meeting point for ${squad.name}.`,
        href: `/squads/${squad.id}`,
        data: { squadId: squad.id, userId: input.userId },
      });
    }
  }

  return { arrived: nowArrived, distanceMetres };
}

/**
 * Hands the squad to somebody else when the leader leaves.
 *
 * Order is deliberate: the longest-serving co-leader first, then the
 * longest-serving member. A squad with no one left to lead is cancelled rather
 * than abandoned with a leaderId pointing at someone who walked away.
 */
export async function transferLeadership(squadId: string, departingLeaderId: string) {
  const successor = await prisma.squadMember.findFirst({
    where: {
      squadId,
      userId: { not: departingLeaderId },
      status: { in: [...ACTIVE_MEMBER_STATUSES] },
      role: { in: ['co-leader', 'member'] },
    },
    // co-leader sorts before member alphabetically, which is the priority we
    // want; joinedAt breaks ties in favour of the longest-serving.
    orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    select: { id: true, userId: true },
  });

  if (!successor) {
    await prisma.squad.update({
      where: { id: squadId },
      data: { status: 'cancelled', isActive: false },
    });
    return null;
  }

  await prisma.$transaction([
    prisma.squad.update({ where: { id: squadId }, data: { leaderId: successor.userId } }),
    prisma.squadMember.update({ where: { id: successor.id }, data: { role: 'leader' } }),
  ]);

  const squad = await prisma.squad.findUnique({
    where: { id: squadId },
    select: { name: true },
  });

  await notify({
    userId: successor.userId,
    type: 'squad.joined',
    title: 'You lead the squad now',
    body: `${squad?.name ?? 'Your squad'} was handed over to you.`,
    href: `/squads/${squadId}`,
    data: { squadId },
  });

  getIO()?.to(`squad:${squadId}`).emit('squad:leadership', {
    squadId,
    leaderId: successor.userId,
  });

  return successor.userId;
}
