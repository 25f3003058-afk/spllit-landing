'use client';

import { motion } from 'motion/react';
import { Quote } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * ⚠️ PLACEHOLDER COPY. These are written examples, not real quotes from real
 * students. Replace every entry with an attributed quote you actually have
 * permission to use before launch — invented testimonials on a live marketing
 * page are a straightforward misrepresentation.
 */
const TESTIMONIALS = [
  {
    quote:
      'Four of us were booking separate cabs to the airport in the same hour. Now we just split one.',
    name: 'Meera K.',
    detail: 'IIT Madras',
    initials: 'MK',
  },
  {
    quote:
      'The map is the part that clicked for me. You can see who is actually heading your way instead of guessing in a group chat.',
    name: 'Arjun R.',
    detail: 'VIT Chennai',
    initials: 'AR',
  },
  {
    quote:
      'Campus email verification means it is never a stranger. That is the only reason I use it at night.',
    name: 'Divya S.',
    detail: 'Anna University',
    initials: 'DS',
  },
];

export function Testimonials({ className }: { className?: string }) {
  return (
    <div className={cn('mx-auto w-full max-w-6xl px-5 lg:px-8', className)}>
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-subtle">
        From campus
      </p>

      <ul className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5">
        {TESTIMONIALS.map((entry, index) => (
          <motion.li
            key={entry.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.08 }}
            className={cn(
              'flex flex-col rounded-2xl border border-line bg-surface p-4 shadow-soft sm:p-5',
              // The third card is the odd one out in a 2-column layout; letting
              // it span both keeps the grid from ending on a ragged half-row.
              'sm:last:col-span-2 lg:last:col-span-1',
            )}
          >
            <Quote className="h-4 w-4 shrink-0 text-brand" aria-hidden />
            <p className="mt-3 flex-1 text-[14px] leading-relaxed text-ink">
              {entry.quote}
            </p>
            <div className="mt-5 flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-muted text-[11px] font-semibold text-brand">
                {entry.initials}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium text-ink">
                  {entry.name}
                </span>
                <span className="block truncate text-[12px] text-ink-muted">
                  {entry.detail}
                </span>
              </span>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
