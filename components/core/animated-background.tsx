'use client';

import { useId, useState, Children, cloneElement, type ReactElement } from 'react';
import { AnimatePresence, motion, type Transition } from 'motion/react';

import { cn } from '@/lib/utils';

/**
 * A pill that slides behind whichever child is active.
 *
 * Each child declares its identity with `data-id`; this renders the moving
 * background and hands the active child `data-checked="true"` so it can style
 * itself. The movement comes from a shared `layoutId` — one element animating
 * between positions rather than several cross-fading, which is what makes it
 * read as a single object rather than a flicker.
 *
 * `layoutId` is namespaced per instance with useId, so two of these on one page
 * do not animate into each other.
 */
export function AnimatedBackground({
  children,
  defaultValue,
  value,
  onValueChange,
  className,
  transition,
  enableHover = false,
}: {
  /**
   * Each child must carry `data-id`. `className` is optional and preserved, so
   * a child can style itself off the `data-checked` this sets.
   */
  children:
    | ReactElement<{ 'data-id': string; className?: string }>[]
    | ReactElement<{ 'data-id': string; className?: string }>;
  /** Uncontrolled starting selection. */
  defaultValue?: string;
  /** Controlled selection. Pass with `onValueChange` to drive it from outside. */
  value?: string;
  onValueChange?: (id: string) => void;
  className?: string;
  transition?: Transition;
  /** Follow the pointer instead of the selection — for menus rather than tabs. */
  enableHover?: boolean;
}) {
  const [internal, setInternal] = useState<string | null>(defaultValue ?? null);
  const uniqueId = useId();

  const controlled = value !== undefined;
  const active = controlled ? value : internal;

  const select = (id: string | null) => {
    if (!controlled) setInternal(id);
    if (id !== null) onValueChange?.(id);
  };

  return Children.map(children, (child) => {
    const id = child.props['data-id'];
    const isActive = active === id;

    const interaction = enableHover
      ? {
          onMouseEnter: () => select(id),
          onMouseLeave: () => select(null),
        }
      : { onClick: () => select(id) };

    return (
      <div
        key={id}
        className="relative inline-flex"
        data-checked={isActive ? 'true' : 'false'}
        {...interaction}
      >
        <AnimatePresence initial={false}>
          {isActive ? (
            <motion.div
              layoutId={`background-${uniqueId}`}
              className={cn('absolute inset-0', className)}
              transition={transition}
              initial={{ opacity: defaultValue ? 1 : 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          ) : null}
        </AnimatePresence>

        {/* The child sits above the pill and is told whether it is selected, so
            the caller controls its own active styling. */}
        {cloneElement(child, {
          'data-checked': isActive ? 'true' : 'false',
          className: cn('relative z-10', child.props.className),
        } as Partial<typeof child.props>)}
      </div>
    );
  });
}
