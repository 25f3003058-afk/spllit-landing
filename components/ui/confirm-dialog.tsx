'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface ConfirmDetailGroup {
  /** Small uppercase heading, e.g. "1 MEMBER REMOVED". */
  label: string;
  /** Rows shown under it — usually names, places or times. */
  items: ReactNode[];
}

/**
 * Confirmation modal for actions that are hard to take back.
 *
 * Unlike `Sheet`, this really is modal: it dims the page, traps Escape and
 * blocks scroll, because the whole point is that the action does not proceed
 * until somebody decides. Sheet stays deliberately non-modal so the map keeps
 * working behind it — the two are not interchangeable.
 *
 * Consequences go in `details` rather than being buried in prose. "You will
 * leave the squad" is easy to skim past; "3 members affected — Riya, Vivek,
 * Arjun" is not.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  eyebrow,
  title,
  description,
  details,
  secondaryDetails,
  confirmLabel = 'Confirm',
  cancelLabel = 'Discard',
  confirmTone = 'primary',
  loading = false,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** Small uppercase kicker above the title, e.g. "LEAVE SQUAD". */
  eyebrow?: string;
  title: string;
  description?: string;
  details?: ConfirmDetailGroup[];
  /** Collapsed behind an "N other changes" toggle. */
  secondaryDetails?: ConfirmDetailGroup[];
  confirmLabel?: string;
  cancelLabel?: string;
  confirmTone?: 'primary' | 'danger';
  loading?: boolean;
  error?: string | null;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [showSecondary, setShowSecondary] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', onKey);

    /**
     * Scroll lock. The dialog is centred over the page, and letting the page
     * behind it move makes the modal feel detached from what it is confirming.
     */
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose, loading]);

  /**
   * Move focus into the panel so the confirm button is one Tab away and screen
   * readers announce the dialog rather than leaving focus on the trigger.
   */
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  const secondaryCount = (secondaryDetails ?? []).reduce(
    (total, group) => total + group.items.length,
    0,
  );

  const renderGroup = (group: ConfirmDetailGroup, key: string) => (
    <div key={key}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-subtle">
        {group.label}
      </p>
      <ul className="mt-2 space-y-1.5">
        {group.items.map((item, index) => (
          <li
            key={index}
            className="flex items-center gap-2 rounded-md bg-surface-sunken px-2.5 py-1.5 text-[13px] text-ink"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => !loading && onClose()}
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[2px]"
          />

          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              ref={panelRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ type: 'spring', stiffness: 460, damping: 34 }}
              className="w-full max-w-[380px] overflow-hidden rounded-xl bg-surface shadow-float outline-none"
            >
              <div className="relative px-5 pb-5 pt-5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  aria-label="Close"
                  className="absolute right-3 top-3 rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink disabled:opacity-40"
                >
                  <X className="h-4 w-4" />
                </button>

                {eyebrow ? (
                  <span className="inline-block rounded-md bg-surface-sunken px-2 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                    {eyebrow}
                  </span>
                ) : null}

                <h2
                  id={titleId}
                  className="mt-3 pr-6 font-display text-[17px] font-semibold tracking-[-0.02em] text-ink"
                >
                  {title}
                </h2>

                {description ? (
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
                    {description}
                  </p>
                ) : null}

                {details?.length ? (
                  <div className="mt-4 space-y-4">
                    {details.map((group, index) => renderGroup(group, `d${index}`))}
                  </div>
                ) : null}

                {secondaryCount > 0 ? (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setShowSecondary((value) => !value)}
                      aria-expanded={showSecondary}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-subtle transition-colors hover:text-ink"
                    >
                      {secondaryCount} other change{secondaryCount === 1 ? '' : 's'}
                      <ChevronRight
                        className={cn(
                          'h-3.5 w-3.5 transition-transform',
                          showSecondary && 'rotate-90',
                        )}
                      />
                    </button>

                    {showSecondary ? (
                      <div className="mt-3 space-y-4">
                        {secondaryDetails?.map((group, index) => renderGroup(group, `s${index}`))}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {error ? (
                  <p role="alert" className="mt-4 text-[12.5px] text-danger">
                    {error}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3.5">
                <Button size="sm" variant="ghost" onClick={onClose} disabled={loading}>
                  {cancelLabel}
                </Button>
                <Button
                  size="sm"
                  variant={confirmTone === 'danger' ? 'danger' : 'primary'}
                  loading={loading}
                  onClick={onConfirm}
                >
                  {confirmLabel}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
