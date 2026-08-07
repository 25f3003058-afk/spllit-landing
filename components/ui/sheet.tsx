'use client';

import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Bottom sheet on mobile, right-hand side panel on desktop.
 *
 * Deliberately not a modal: the backdrop is transparent to pointer events on
 * desktop and only dims on mobile, so the map stays visible and interactive
 * behind a marker preview (Section 6.2).
 */
export function Sheet({
  open,
  onClose,
  children,
  title,
  side = 'auto',
  className,
  /** When false the backdrop never intercepts clicks — used over the map. */
  dismissOnBackdrop = true,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  side?: 'auto' | 'bottom' | 'right';
  className?: string;
  dismissOnBackdrop?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const bottomOnly = side === 'bottom';
  const rightOnly = side === 'right';

  return (
    <AnimatePresence>
      {open ? (
        <>
          {dismissOnBackdrop ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={onClose}
              // Dim only on mobile — on desktop the panel sits beside content
              // that should stay legible.
              className="fixed inset-0 z-40 bg-black/25 lg:bg-transparent"
            />
          ) : null}

          <motion.div
            role="dialog"
            aria-modal="false"
            aria-label={title}
            initial={{ opacity: 0, y: bottomOnly || !rightOnly ? 24 : 0, x: rightOnly ? 24 : 0 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: bottomOnly || !rightOnly ? 24 : 0, x: rightOnly ? 24 : 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 38 }}
            className={cn(
              'fixed z-50 glass shadow-float',
              // Mobile: bottom sheet.
              !rightOnly &&
                'inset-x-0 bottom-0 max-h-[78dvh] overflow-y-auto rounded-t-xl',
                // Clears the floating dock so its actions stay reachable.
                !rightOnly && 'pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-6',
              // Desktop: floating side panel.
              !bottomOnly &&
                'lg:inset-x-auto lg:bottom-6 lg:right-6 lg:top-auto lg:max-h-[calc(100dvh-8rem)] lg:w-[380px] lg:rounded-xl',
              className,
            )}
          >
            {/* Drag affordance — mobile only. */}
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 rounded-t-xl bg-transparent px-5 pb-2 pt-3 lg:hidden">
              <span className="mx-auto h-1 w-9 rounded-full bg-line-strong" />
            </div>

            {title ? (
              <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-1 lg:pt-5">
                <h2 className="font-display text-base font-semibold tracking-[-0.01em] text-ink">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}

            <div className={cn('px-5 pb-6', !title && 'pt-2 lg:pt-5')}>{children}</div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
