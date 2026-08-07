import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Feed section wrapper. Each section owns its own loading/empty state so a slow
 * section never blocks a fast one (Section 5.3, Section 7.2).
 */
export function Section({
  title,
  description,
  href,
  hrefLabel = 'See all',
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-[17px] font-semibold tracking-[-0.015em] text-ink">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-[13px] text-ink-muted">{description}</p>
          ) : null}
        </div>
        {action ??
          (href ? (
            <Link
              href={href}
              className="group inline-flex shrink-0 items-center gap-0.5 text-[13px] font-medium text-ink-muted transition-colors hover:text-brand"
            >
              {hrefLabel}
              <ChevronRight className="h-3.5 w-3.5 transition-transform duration-snap group-hover:translate-x-0.5" />
            </Link>
          ) : null)}
      </div>
      {children}
    </section>
  );
}

/**
 * Horizontally scrolling rail used by the Home feed.
 *
 * The negative margin must match the shell's horizontal padding exactly (px-4
 * on mobile, px-6 from lg). A larger bleed overhangs the viewport and puts a
 * horizontal scrollbar on the whole page.
 */
export function Rail({ children }: { children: ReactNode }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
      {children}
    </div>
  );
}
