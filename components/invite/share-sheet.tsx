'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight, Mail, MessageCircle, Send, Share2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * Share targets.
 *
 * Plain URLs, deliberately — every one of these is a documented web intent that
 * works without an SDK, an app id or a script tag. Pulling in the Facebook or X
 * SDKs to open a pre-filled compose window would add tracking to a page whose
 * only job is to hand over a link.
 */
function targetsFor(url: string, message: string) {
  const encodedUrl = encodeURIComponent(url);
  const encodedMessage = encodeURIComponent(message);

  return [
    {
      key: 'email',
      label: 'Send with email',
      Icon: Mail,
      href: `mailto:?subject=${encodeURIComponent('Join me on Spllit')}&body=${encodedMessage}%20${encodedUrl}`,
    },
    {
      key: 'whatsapp',
      label: 'Send with WhatsApp',
      Icon: MessageCircle,
      href: `https://wa.me/?text=${encodedMessage}%20${encodedUrl}`,
    },
    {
      key: 'telegram',
      label: 'Send with Telegram',
      Icon: Send,
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`,
    },
    {
      key: 'x',
      label: 'Post on X',
      Icon: Share2,
      href: `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`,
    },
  ];
}

export function ShareSheet({
  open,
  onClose,
  url,
  message,
}: {
  open: boolean;
  onClose: () => void;
  url: string;
  message: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  const targets = targetsFor(url, message);

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
              role="dialog"
              aria-modal="true"
              aria-label="Share invitation"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 440, damping: 34 }}
              className="w-full max-w-[420px] overflow-hidden rounded-t-2xl bg-surface shadow-float sm:rounded-2xl"
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="font-display text-[15px] font-semibold tracking-[-0.01em] text-ink">
                  Share invitation
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <ul className="divide-y divide-line">
                {targets.map(({ key, label, Icon, href }) => (
                  <li key={key}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={onClose}
                      className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-sunken"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-ink">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 text-[13.5px] font-medium text-ink">
                        {label}
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-ink-subtle" />
                    </a>
                  </li>
                ))}
              </ul>

              <div className="p-4">
                <Button size="lg" className="w-full" onClick={onClose}>
                  Done
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
