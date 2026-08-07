import prisma from '../utils/prisma.js';
import { getIO } from './live.js';

/**
 * Notification dispatch: one write to Mongo (durable, drives the in-app list)
 * plus a socket ping to the recipient (drives the live badge). FCM web/mobile
 * push is layered on top for when the client is not connected.
 */

export type NotificationType =
  | 'squad.joined'
  /** Someone asked to join; the leader has to approve or reject. */
  | 'squad.join_requested'
  | 'squad.meeting_point_updated'
  | 'ride.accepted'
  | 'ride.arriving'
  | 'ride.started'
  | 'ride.completed'
  | 'ride.cancelled'
  | 'friend.nearby'
  | 'event.created'
  | 'event.reminder'
  | 'community.mention'
  | 'chat.message'
  // Host verification outcomes. Dotted like the rest so the client can group
  // by prefix without a lookup table.
  | 'host.vehicle_verified'
  | 'host.vehicle_rejected';

export interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  imageUrl?: string;
  data?: Record<string, unknown>;
}

export async function notify(input: NotifyInput) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
      imageUrl: input.imageUrl ?? null,
      data: (input.data ?? null) as never,
    },
  });

  // The client refetches on this signal rather than receiving the payload, so
  // a notification can never arrive out of order with the list it belongs to.
  getIO()?.to(`user:${input.userId}`).emit('notification:new', { id: notification.id });

  await pushToDevices(input).catch((error) => {
    // A failed push must never fail the action that triggered it.
    console.error('[notify] push failed:', error);
  });

  return notification;
}

/**
 * FCM fan-out. Uses the tokens registered by the web client (service worker)
 * and the mobile app. Silently no-ops when Firebase Admin is unconfigured so
 * local development does not need credentials.
 */
async function pushToDevices(input: NotifyInput) {
  const { isFirebaseAdminConfigured } = await import('../utils/firebaseAdmin.js');
  if (!isFirebaseAdminConfigured()) return;

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { fcmTokens: true },
  });
  if (!user?.fcmTokens?.length) return;

  const { getMessaging } = await import('firebase-admin/messaging');
  const response = await getMessaging().sendEachForMulticast({
    tokens: user.fcmTokens,
    notification: { title: input.title, body: input.body },
    data: {
      type: input.type,
      ...(input.href ? { href: input.href } : {}),
    },
  });

  // Prune tokens the device no longer accepts, otherwise the list grows
  // unbounded and every push wastes quota on dead endpoints.
  const dead = response.responses
    .map((result, index) => (result.success ? null : user.fcmTokens[index]))
    .filter((token): token is string => Boolean(token));

  if (dead.length > 0) {
    await prisma.user.update({
      where: { id: input.userId },
      data: { fcmTokens: user.fcmTokens.filter((t) => !dead.includes(t)) },
    });
  }
}
