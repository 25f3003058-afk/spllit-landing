'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * Calendar, on react-day-picker v10.
 *
 * Ported from the originui version but painted with this project's tokens.
 * The upstream copy leans on shadcn's `buttonVariants` and a `--primary` /
 * `--muted-foreground` palette, neither of which exists here — importing it
 * would have meant pulling in `cva` and `@radix-ui/react-slot` to render two
 * chevrons.
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components: userComponents,
  ...props
}: CalendarProps) {
  const navButton = cn(
    'inline-flex size-9 items-center justify-center rounded-lg p-0',
    'text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink',
    'disabled:pointer-events-none disabled:opacity-40',
  );

  const defaultClassNames = {
    months: 'relative flex flex-col gap-4 sm:flex-row',
    month: 'w-full',
    month_caption: 'relative mx-10 mb-1 flex h-9 items-center justify-center z-20',
    caption_label: 'text-sm font-medium text-ink',
    nav: 'absolute top-0 flex w-full justify-between z-10',
    button_previous: navButton,
    button_next: navButton,
    weekday: 'size-9 p-0 text-xs font-medium text-ink-subtle',
    day_button: cn(
      'relative flex size-9 items-center justify-center whitespace-nowrap rounded-lg p-0',
      'text-sm text-ink outline-offset-2 transition-colors',
      'hover:bg-surface-sunken',
      'group-data-[selected]:bg-brand group-data-[selected]:text-brand-fg',
      'group-data-[disabled]:pointer-events-none group-data-[disabled]:text-ink-subtle group-data-[disabled]:line-through',
      'group-data-[outside]:text-ink-subtle',
    ),
    day: 'group size-9 px-0 text-sm',
    today:
      // Dot under today. Flips to the selected foreground when the day is also
      // selected, otherwise it disappears into the brand fill.
      '*:after:pointer-events-none *:after:absolute *:after:bottom-1 *:after:start-1/2 *:after:z-10 *:after:size-[3px] *:after:-translate-x-1/2 *:after:rounded-full *:after:bg-brand [&[data-selected]>*]:after:bg-brand-fg',
    outside: 'text-ink-subtle',
    hidden: 'invisible',
    week_number: 'size-9 p-0 text-xs font-medium text-ink-subtle',
  };

  const mergedClassNames: typeof defaultClassNames = Object.keys(defaultClassNames).reduce(
    (acc, key) => ({
      ...acc,
      [key]: classNames?.[key as keyof typeof classNames]
        ? cn(
            defaultClassNames[key as keyof typeof defaultClassNames],
            classNames[key as keyof typeof classNames],
          )
        : defaultClassNames[key as keyof typeof defaultClassNames],
    }),
    {} as typeof defaultClassNames,
  );

  const mergedComponents = {
    Chevron: ({ orientation }: { orientation?: 'up' | 'down' | 'left' | 'right' }) =>
      orientation === 'left' ? (
        <ChevronLeft size={16} strokeWidth={2} aria-hidden />
      ) : (
        <ChevronRight size={16} strokeWidth={2} aria-hidden />
      ),
    ...userComponents,
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('w-fit', className)}
      classNames={mergedClassNames}
      components={mergedComponents}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
