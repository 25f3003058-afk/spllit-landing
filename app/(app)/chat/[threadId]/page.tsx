'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ChatThreadView } from '@/components/chat/chat-thread';
import { useThread } from '@/lib/hooks/queries';

export default function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = use(params);
  const { data: thread, isPending } = useThread(threadId);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/chat"
          aria-label="Back to chat"
          className="rounded-md p-2 text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        {isPending ? (
          <Skeleton className="h-5 w-40" />
        ) : (
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar src={thread?.imageUrl} name={thread?.title} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-ink">
                {thread?.title ?? 'Conversation'}
              </p>
              <p className="truncate text-[12px] text-ink-subtle">
                {thread?.participants.length ?? 0} participants
              </p>
            </div>
          </div>
        )}
      </div>

      {thread ? (
        <ChatThreadView contextType={thread.contextType} contextId={thread.contextId} />
      ) : (
        <Skeleton className="h-[460px] w-full rounded-lg" />
      )}
    </div>
  );
}
