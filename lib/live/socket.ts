'use client';

import { io, type Socket } from 'socket.io-client';

import { config } from '@/lib/config';
import type { LivePosition, Presence, RideTracking, ChatMessage } from '@/types';

/**
 * The live/ephemeral layer. This is what the original spec put in Firebase RTDB;
 * on this stack it is Socket.IO rooms against the Express backend.
 *
 * Rule mirrored from that spec: subscribe only to the rooms relevant to what is
 * on screen (the active ride, the open squad, the visible map bounds) — never a
 * firehose of every position on the platform.
 */

export interface ServerToClient {
  'position:update': (payload: LivePosition) => void;
  'presence:update': (payload: Presence) => void;
  'ride:tracking': (payload: RideTracking) => void;
  'ride:status': (payload: { rideId: string; status: string }) => void;
  'chat:message': (payload: ChatMessage) => void;
  'chat:typing': (payload: { threadId: string; userId: string; typing: boolean }) => void;
  'squad:meeting-point': (payload: {
    squadId: string;
    lat: number;
    lng: number;
    label: string | null;
  }) => void;
  /**
   * A member moved, with the server's verdict on whether that puts them at the
   * meeting point. Arrival is decided server-side from the reported position,
   * so the client renders `arrived` rather than recomputing a radius the
   * server would disagree with.
   */
  'squad:member-position': (payload: {
    squadId: string;
    userId: string;
    lat: number;
    lng: number;
    distanceMetres: number | null;
    arrived: boolean;
    updatedAt: number;
  }) => void;
  /** Roster changed — joined, admitted, removed, left. Refetch, don't patch. */
  'squad:members-changed': (payload: { squadId: string }) => void;
  'squad:leadership': (payload: { squadId: string; leaderId: string }) => void;
  'notification:new': (payload: { id: string }) => void;
}

export interface ClientToServer {
  'room:join': (room: string) => void;
  'room:leave': (room: string) => void;
  'position:publish': (payload: {
    lat: number;
    lng: number;
    heading: number | null;
  }) => void;
  'chat:send': (payload: {
    threadId: string;
    clientId: string;
    content: string;
    type: string;
    metadata?: Record<string, unknown>;
  }) => void;
  'chat:typing': (payload: { threadId: string; typing: boolean }) => void;
}

export type SpllitSocket = Socket<ServerToClient, ClientToServer>;

let socket: SpllitSocket | null = null;
let tokenProvider: (() => Promise<string | null>) | null = null;

/** Reference-counted rooms so two components watching the same squad don't
 *  tear each other's subscription down on unmount. */
const roomRefCounts = new Map<string, number>();

export function setSocketTokenProvider(fn: (() => Promise<string | null>) | null) {
  tokenProvider = fn;
}

export function getSocket(): SpllitSocket {
  if (socket) return socket;

  socket = io(config.api.socketUrl, {
    autoConnect: false,
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
    auth: async (cb: (data: Record<string, unknown>) => void) => {
      const token = tokenProvider ? await tokenProvider() : null;
      cb({ token });
    },
  }) as SpllitSocket;

  // Re-join every room we were in before the drop; the server has no memory of
  // our subscriptions across a reconnect.
  socket.on('connect', () => {
    for (const room of roomRefCounts.keys()) {
      socket?.emit('room:join', room);
    }
  });

  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  socket?.disconnect();
  roomRefCounts.clear();
}

/**
 * Join a room and return the matching leave function. Always call the returned
 * function on unmount — leaked rooms are the main cause of duplicate markers.
 */
export function joinRoom(room: string): () => void {
  const s = connectSocket();
  const next = (roomRefCounts.get(room) ?? 0) + 1;
  roomRefCounts.set(room, next);
  if (next === 1) s.emit('room:join', room);

  let released = false;
  return () => {
    if (released) return;
    released = true;
    const count = (roomRefCounts.get(room) ?? 1) - 1;
    if (count <= 0) {
      roomRefCounts.delete(room);
      s.emit('room:leave', room);
    } else {
      roomRefCounts.set(room, count);
    }
  };
}

/** Room name helpers — keep every room string in one place. */
export const rooms = {
  ride: (rideId: string) => `ride:${rideId}`,
  squad: (squadId: string) => `squad:${squadId}`,
  event: (eventId: string) => `event:${eventId}`,
  thread: (threadId: string) => `thread:${threadId}`,
  user: (userId: string) => `user:${userId}`,
  /** Map viewport tile — the server fans out only positions inside it. */
  area: (geohash: string) => `area:${geohash}`,
} as const;

/** Typed on/off pair that guarantees the handler is removed. */
export function onEvent<K extends keyof ServerToClient>(
  event: K,
  handler: ServerToClient[K],
): () => void {
  const s = connectSocket();
  s.on(event, handler as never);
  return () => {
    s.off(event, handler as never);
  };
}
