'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ChatThreadView } from '@/components/chat/chat-thread';
import type { ChatContextType } from '@/types';

/**
 * Chat as a centred dialog.
 *
 * Inline, the thread was a 460px box in the middle of a scrolling page: reading
 * it meant scrolling the page, and the composer drifted off screen while you
 * typed. A conversation wants the whole viewport's attention, so this takes it
 * and gives back a close button.
 *
 * The transcript scrolls inside the panel, not the page — the composer stays
 * pinned at the bottom where you left it.
 */
export function ChatDialog({
  open,
  onClose,
  contextType,
  contextId,
  title,
  subtitle,
}: {
  open: boolean;
  onClose: () => void;
  contextType: ChatContextType;
  contextId: string;
  title: string;
  subtitle?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    // The page behind must not scroll — moving it while a conversation is open
    // loses the reader's place for no reason.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/35 backdrop-blur-[2px]"
          />

          <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.div
              ref={panelRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label={`${title} chat`}
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 440, damping: 34 }}
              className={cn(
                'flex w-full max-w-[520px] flex-col overflow-hidden bg-surface shadow-float outline-none',
                // Full height on a phone, a tall card on desktop.
                'h-[92dvh] rounded-t-2xl sm:h-[min(80dvh,640px)] sm:rounded-2xl',
              )}
            >
              <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[15px] font-semibold tracking-[-0.01em] text-ink">
                    {title}
                  </p>
                  {subtitle ? (
                    <p className="truncate text-[12.5px] text-ink-muted">{subtitle}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close chat"
                  className="shrink-0 rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* min-h-0 is what lets the thread scroll inside a flex column
                  instead of growing past the panel and taking the page with it. */}
              <div className="min-h-0 flex-1">
                <ChatThreadView
                  contextType={contextType}
                  contextId={contextId}
                  className="h-full rounded-none border-0 shadow-none sm:h-full"
                />
              </div>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
