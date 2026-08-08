'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { onEvent } from '@/lib/live/socket';
import { qk } from '@/lib/hooks/queries';

/**
 * App-wide subscription to the live events that change what is on screen.
 *
 * The socket was already connected for every signed-in user, and the server was
 * already emitting — but only two places listened: the open chat thread, and
 * the notifications page. So a message arriving while you were anywhere else
 * updated nothing. No unread badge, no inbox row, no count. The only way to see
 * it was a full page refresh, which is exactly what it felt like.
 *
 * This listens once, at the top of the tree, and invalidates rather than
 * writing into the cache. Invalidating means the list and its badge are always
 * refetched from the same source at the same moment, so a count can never
 * disagree with the rows under it — and a payload that arrives out of order
 * cannot corrupt anything, because the payload is not what we store.
 *
 * Mounted inside QueryProvider and AuthProvider; it renders nothing.
 */
export function RealtimeBridge() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const offs: Array<() => void> = [];

    /**
     * A new notification. The badge in the top bar and the account menu both
     * read `unreadCount`, and neither had any way to learn about this.
     */
    offs.push(
      onEvent('notification:new', () => {
        void queryClient.invalidateQueries({ queryKey: qk.notifications });
        void queryClient.invalidateQueries({ queryKey: qk.unreadCount });
      }),
    );

    /**
     * A chat message. The open thread handles its own live append — that path
     * is unchanged and still the fast one. This is for every *other* surface:
     * the thread list, its unread markers, and the badge.
     *
     * Scoped by thread id so an open conversation is not refetched underneath
     * the message it just rendered.
     */
    offs.push(
      onEvent('chat:message', (message) => {
        void queryClient.invalidateQueries({ queryKey: qk.threads });
        void queryClient.invalidateQueries({ queryKey: qk.unreadCount });
        const threadId = (message as { threadId?: string })?.threadId;
        if (threadId) {
          void queryClient.invalidateQueries({ queryKey: qk.thread(threadId) });
        }
      }),
    );

    /**
     * A ride changed state — including being cancelled.
     *
     * The server already excludes cancelled rides from every discovery query,
     * so this is purely about *when* the client finds out. Without it a
     * cancelled ride sat in a stale list until the cache expired, which reads
     * as the cancellation not having worked.
     */
    offs.push(
      onEvent('ride:status', (payload) => {
        void queryClient.invalidateQueries({ queryKey: ['rides'] });
        void queryClient.invalidateQueries({ queryKey: ['planner-rides'] });
        void queryClient.invalidateQueries({ queryKey: ['planner-availability'] });
        const rideId = (payload as { rideId?: string })?.rideId;
        if (rideId) void queryClient.invalidateQueries({ queryKey: qk.ride(rideId) });
      }),
    );

    return () => {
      for (const off of offs) off();
    };
  }, [queryClient]);

  return null;
}
