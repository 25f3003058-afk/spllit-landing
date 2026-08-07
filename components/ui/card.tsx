import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Raises the card and adds a hover affordance — for clickable list rows. */
  interactive?: boolean;
  padded?: boolean;
}

export function Card({
  className,
  interactive,
  padded = true,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-line bg-surface',
        padded && 'p-5',
        interactive &&
          'cursor-pointer transition-all duration-snap hover:border-line-strong hover:shadow-raised',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h3 className="truncate font-display text-[15px] font-semibold tracking-[-0.01em] text-ink">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ink-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
