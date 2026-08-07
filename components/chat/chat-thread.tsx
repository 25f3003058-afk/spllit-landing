'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, SendHorizontal } from 'lucide-react';

import { cn, formatRelative } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { chatService } from '@/lib/services/chat';
import { qk } from '@/lib/hooks/queries';
import { useAuth } from '@/lib/auth/auth-provider';
import { connectSocket, joinRoom, onEvent, rooms } from '@/lib/live/socket';
import type { ChatContextType, ChatMessage, Paginated } from '@/types';

/**
 * The one chat surface. Squad chat, ride chat, community channels and DMs all
 * render this component and differ only by `contextType` — there is no second
 * implementation anywhere in the app (Section 5.9).
 */
export function ChatThreadView({
  contextType,
  contextId,
  className,
}: {
  contextType: ChatContextType;
  contextId: string;
  className?: string;
}) {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Resolve (or create) the thread for this context before loading history.
  const { data: thread, isPending: threadPending } = useQuery({
    queryKey: ['chat', 'resolve', contextType, contextId],
    queryFn: () => chatService.resolveThread(contextType, contextId),
    staleTime: 5 * 60_000,
  });

  const threadId = thread?.id ?? null;

  const { data, isPending } = useQuery({
    queryKey: qk.threadMessages(threadId ?? ''),
    queryFn: () => chatService.messages(threadId as string),
    enabled: Boolean(threadId),
    staleTime: 0,
  });

  const messages = useMemo(
    // The API returns newest-first for pagination; render oldest-first.
    () => [...(data?.items ?? [])].reverse(),
    [data],
  );

  // Live delivery. Only this thread's room is subscribed.
  useEffect(() => {
    if (!threadId) return;
    const leave = joinRoom(rooms.thread(threadId));

    const off = onEvent('chat:message', (incoming) => {
      if (incoming.threadId !== threadId) return;
      qc.setQueryData<Paginated<ChatMessage>>(qk.threadMessages(threadId), (prev) => {
        if (!prev) return { items: [incoming], nextCursor: null };
        // Replace the optimistic copy if the server echoed our own message back.
        const withoutPending = prev.items.filter(
          (m) => !(m.pending && m.content === incoming.content),
        );
        if (withoutPending.some((m) => m.id === incoming.id)) return prev;
        return { ...prev, items: [incoming, ...withoutPending] };
      });
    });

    return () => {
      off();
      leave();
    };
  }, [threadId, qc]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const send = useCallback(() => {
    const content = draft.trim();
    if (!content || !threadId || !profile) return;

    const clientId = `local-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: clientId,
      threadId,
      senderId: profile.id,
      sender: {
        id: profile.id,
        name: profile.name,
        username: profile.username,
        profilePhoto: profile.profilePhoto,
        college: profile.college,
      },
      content,
      type: 'text',
      metadata: null,
      replyToId: null,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    // Optimistic append — the bubble appears instantly and reconciles when the
    // server echoes it back over the socket (Section 7.3).
    qc.setQueryData<Paginated<ChatMessage>>(qk.threadMessages(threadId), (prev) =>
      prev ? { ...prev, items: [optimistic, ...prev.items] } : { items: [optimistic], nextCursor: null },
    );
    setDraft('');

    const socket = connectSocket();
    if (socket.connected) {
      socket.emit('chat:send', { threadId, clientId, content, type: 'text' });
    } else {
      // Offline or socket down — fall back to HTTP so the message is not lost.
      void chatService
        .send(threadId, { clientId, content, type: 'text' })
        .then((saved) => {
          qc.setQueryData<Paginated<ChatMessage>>(qk.threadMessages(threadId), (prev) =>
            prev
              ? { ...prev, items: prev.items.map((m) => (m.id === clientId ? saved : m)) }
              : prev,
          );
        })
        .catch(() => {
          qc.setQueryData<Paginated<ChatMessage>>(qk.threadMessages(threadId), (prev) =>
            prev
              ? {
                  ...prev,
                  items: prev.items.map((m) =>
                    m.id === clientId ? { ...m, pending: false, failed: true } : m,
                  ),
                }
              : prev,
          );
        });
    }
  }, [draft, threadId, profile, qc]);

  if (threadPending || isPending) {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={cn('flex gap-2', i % 2 === 0 ? '' : 'flex-row-reverse')}>
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className={cn('h-9 rounded-lg', i % 2 === 0 ? 'w-48' : 'w-36')} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn(
        'flex flex-col rounded-lg border border-line bg-surface',
        // Fills the space left by the top bar and dock instead of a fixed
        // height that overflows small phones and wastes space on desktop.
        'h-[min(60vh,460px)] sm:h-[460px]',
        className,
      )}>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <EmptyState
            className="border-0"
            icon={<MessageCircle className="h-5 w-5" />}
            title="No messages yet"
            description="Say something — everyone in here will see it."
          />
        ) : (
          messages.map((message) => {
            const mine = message.senderId === profile?.id;
            return (
              <div
                key={message.id}
                className={cn('flex items-end gap-2', mine && 'flex-row-reverse')}
              >
                {!mine ? (
                  <Avatar
                    src={message.sender?.profilePhoto}
                    name={message.sender?.name}
                    size="xs"
                  />
                ) : null}
                <div className={cn('max-w-[75%]', mine && 'text-right')}>
                  {!mine ? (
                    <p className="mb-0.5 px-1 text-[11px] text-ink-subtle">
                      {message.sender?.name}
                    </p>
                  ) : null}
                  <div
                    className={cn(
                      'inline-block rounded-lg px-3.5 py-2 text-[13.5px] leading-relaxed',
                      mine
                        ? 'bg-brand text-brand-fg'
                        : 'bg-surface-sunken text-ink',
                      message.pending && 'opacity-60',
                      message.failed && 'ring-1 ring-danger',
                    )}
                  >
                    {message.content}
                  </div>
                  <p className="mt-0.5 px-1 text-[10.5px] text-ink-subtle">
                    {message.failed
                      ? 'Not sent'
                      : message.pending
                        ? 'Sending…'
                        : formatRelative(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 border-t border-line p-3"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message"
          aria-label="Message"
          className="h-10 flex-1 rounded-lg bg-surface-sunken px-3.5 text-sm text-ink outline-none placeholder:text-ink-subtle focus:ring-1 focus:ring-brand"
        />
        <Button type="submit" size="icon" disabled={!draft.trim()} aria-label="Send">
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
