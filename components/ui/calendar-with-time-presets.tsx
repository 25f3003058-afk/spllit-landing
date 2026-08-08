'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';

/**
 * Date plus a time preset, as one control.
 *
 * Stacked rather than the upstream side-by-side layout: this lives in the trip
 * planner's 356px panel, where a calendar and a 12rem time column side by side
 * would each be too narrow to hit. Times become a three-column grid under the
 * calendar, which is also what the upstream layout collapses to on mobile.
 */

export interface CalendarWithTimePresetsProps {
  /** Selected moment, or null for "not scheduled". */
  value: Date | null;
  onChange: (next: Date) => void;
  /**
   * Fired when the picker has a complete answer, i.e. a time slot was tapped.
   * Lets a caller collapse the calendar rather than leaving it open over the
   * rest of the form after the choice has been made.
   */
  onDone?: () => void;
  /** Slots before this are disabled. Defaults to now. */
  minDate?: Date;
  /** Minutes between slots. */
  stepMinutes?: number;
  startHour?: number;
  endHour?: number;
  className?: string;
}

function buildSlots(startHour: number, endHour: number, stepMinutes: number): string[] {
  const slots: string[] = [];
  for (let minutes = startHour * 60; minutes <= endHour * 60; minutes += stepMinutes) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
  }
  return slots;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function CalendarWithTimePresets({
  value,
  onChange,
  onDone,
  minDate,
  stepMinutes = 30,
  startHour = 5,
  endHour = 23,
  className,
}: CalendarWithTimePresetsProps) {
  const floor = minDate ?? new Date();
  const selected = value ?? floor;

  const slots = React.useMemo(
    () => buildSlots(startHour, endHour, stepMinutes),
    [startHour, endHour, stepMinutes],
  );

  const selectedTime = `${String(selected.getHours()).padStart(2, '0')}:${String(
    Math.floor(selected.getMinutes() / stepMinutes) * stepMinutes,
  ).padStart(2, '0')}`;

  /**
   * Keeps the time when the day changes, and the day when the time changes.
   *
   * With one correction: the carried-over time can land in the past. Pick next
   * Sunday, choose 05:00, then tap back to today — the day is legal and 05:00
   * was legal on Sunday, so the old version committed a departure that had
   * already happened. The slot then rendered struck-through while the field
   * above it displayed that same time as the chosen one, and the search ran
   * against a moment in the past.
   *
   * Clamping forward rather than rejecting: the tap was on a *day*, and
   * refusing it would look like the calendar was ignoring the press. Moving to
   * the next bookable slot keeps the day the user asked for.
   */
  const commit = (day: Date, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const next = new Date(day);
    next.setHours(hours ?? 0, minutes ?? 0, 0, 0);

    if (next.getTime() < floor.getTime()) {
      const clamped = new Date(floor);
      // Round up to the next slot boundary; setMinutes handles the hour roll.
      clamped.setMinutes(Math.ceil(clamped.getMinutes() / stepMinutes) * stepMinutes, 0, 0);
      onChange(clamped);
      return;
    }

    onChange(next);
  };

  return (
    <div className={cn('rounded-xl border border-line bg-surface', className)}>
      <div className="flex justify-center p-3">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(day) => day && commit(day, selectedTime)}
          defaultMonth={selected}
          // Nobody schedules a ride into the past.
          disabled={{ before: new Date(floor.getFullYear(), floor.getMonth(), floor.getDate()) }}
          showOutsideDays={false}
          className="bg-transparent p-0"
          formatters={{
            formatWeekdayName: (date) => date.toLocaleString(undefined, { weekday: 'narrow' }),
          }}
        />
      </div>

      {/*
        Taller on touch, and `overscroll-contain`.

        This is a scroller inside the planner's scrolling sidebar, and nested
        touch scrollers are where taps go to die: a press that begins while the
        outer list still has momentum is treated as a scroll grab, not a tap, so
        the slot never fires. Containing the overscroll stops the gesture being
        handed to the parent mid-press, and showing more rows at once means far
        less scrolling inside the inner box to begin with.
      */}
      <div className="no-scrollbar max-h-64 overscroll-contain overflow-y-auto border-t border-line p-3 sm:max-h-44">
        <div className="grid grid-cols-3 gap-1.5">
          {slots.map((time) => {
            const active = time === selectedTime;
            // Only today's already-gone slots are dead; a future date offers
            // the whole day.
            const [hours, minutes] = time.split(':').map(Number);
            const slotMoment = new Date(selected);
            slotMoment.setHours(hours ?? 0, minutes ?? 0, 0, 0);
            const past = sameDay(selected, floor) && slotMoment.getTime() < floor.getTime();

            return (
              <button
                key={time}
                type="button"
                disabled={past}
                aria-pressed={active}
                onClick={() => {
                  commit(selected, time);
                  /**
                   * Picking a time is the terminal step, so this is the only
                   * place `onDone` fires. A day on its own is an incomplete
                   * choice — closing on the day tap would leave whatever time
                   * happened to be selected, which is rarely what was meant.
                   */
                  onDone?.();
                }}
                className={cn(
                  // 44px on touch, 36px with a mouse. A 36px target in a
                  // three-column grid is about 20px of usable width per slot
                  // once the gaps are taken out, which a thumb misses often
                  // enough to read as the picker not responding.
                  'h-11 sm:h-9',
                  'rounded-lg text-[13px] font-medium tabular-nums transition-colors duration-snap',
                  active
                    ? 'bg-brand text-brand-fg'
                    : 'border border-line text-ink hover:bg-surface-sunken',
                  past && 'pointer-events-none opacity-35 line-through',
                )}
              >
                {time}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
