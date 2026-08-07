'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Date + time picker, in the iOS calendar style.
 *
 * Adapted rather than dropped in. The reference implementation hardcoded Apple's
 * palette (#FF3B30, #E3E3E8, #1C1C1E) and carried its own light/dark toggle that
 * wrote to `document.documentElement.classList` — a date picker that changes the
 * whole application's theme is a bug, and the app already owns that switch.
 * Colours come from the design tokens so this works in both themes without
 * knowing which one is active.
 *
 * Two behaviours the reference lacked and a departure time needs:
 *   - days before `minDate` are disabled, because nothing departs in the past,
 *   - the time inputs cannot be left empty, so there is no state where a date is
 *     chosen and the time silently reads NaN.
 */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const firstWeekday = (year: number, month: number) => new Date(year, month, 1).getDay();

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function DateTimePicker({
  value,
  onChange,
  minDate,
  className,
}: {
  /** Selected moment, or null when nothing is chosen yet. */
  value: Date | null;
  onChange: (next: Date) => void;
  /** Days before this are not selectable. Defaults to today. */
  minDate?: Date;
  className?: string;
}) {
  const floor = useMemo(() => startOfDay(minDate ?? new Date()), [minDate]);
  const selected = value ?? null;
  const initial = selected ?? new Date();

  const [year, setYear] = useState(initial.getFullYear());
  const [month, setMonth] = useState(initial.getMonth());
  const [pickingMonth, setPickingMonth] = useState(false);

  const hours24 = selected?.getHours() ?? 9;
  const minutes = selected?.getMinutes() ?? 0;
  const isPm = hours24 >= 12;
  // 0 and 12 both display as 12 on a 12-hour clock.
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

  /** Writes a new moment, carrying whichever half the caller did not change. */
  const commit = (next: { day?: number; hour12?: number; minute?: number; pm?: boolean }) => {
    const day = next.day ?? selected?.getDate() ?? new Date().getDate();
    const pm = next.pm ?? isPm;
    const rawHour = next.hour12 ?? hours12;
    const hour = pm ? (rawHour % 12) + 12 : rawHour % 12;

    const result = new Date(year, month, day, hour, next.minute ?? minutes, 0, 0);
    onChange(result);
  };

  const step = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  };

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday(year, month) }, () => null),
    ...Array.from({ length: daysInMonth(year, month) }, (_, index) => index + 1),
  ];

  return (
    <div
      className={cn(
        'w-full max-w-[330px] rounded-xl border border-line bg-surface p-4 shadow-soft',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setPickingMonth((open) => !open)}
          aria-expanded={pickingMonth}
          className="flex items-center gap-1 text-[15px] font-semibold text-ink transition-opacity hover:opacity-70"
        >
          {MONTHS[month]} {year}
          <ChevronDown
            className={cn('h-3.5 w-3.5 transition-transform', pickingMonth && 'rotate-180')}
          />
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous month"
            className="rounded-full p-1.5 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next month"
            className="rounded-full p-1.5 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative mt-3">
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {WEEKDAYS.map((label, index) => (
            <div
              key={`${label}-${index}`}
              className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 justify-items-center gap-y-1">
          {cells.map((day, index) => {
            if (day === null) return <span key={`pad-${index}`} className="h-9 w-9" />;

            const date = new Date(year, month, day);
            const disabled = date < floor;
            const isSelected =
              selected !== null &&
              selected.getFullYear() === year &&
              selected.getMonth() === month &&
              selected.getDate() === day;

            return (
              <button
                key={day}
                type="button"
                disabled={disabled}
                aria-pressed={isSelected}
                onClick={() => commit({ day })}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full text-[14px] font-medium transition-colors',
                  isSelected
                    ? 'bg-brand font-semibold text-brand-fg'
                    : 'text-ink hover:bg-surface-sunken',
                  disabled && 'pointer-events-none text-ink-subtle opacity-40',
                )}
              >
                {day}
              </button>
            );
          })}
        </div>

        {pickingMonth ? (
          <div className="absolute inset-0 z-20 rounded-lg bg-surface/95 p-2 backdrop-blur-sm">
            <div className="mb-2 flex items-center justify-between border-b border-line pb-2">
              <button
                type="button"
                onClick={() => setYear((y) => y - 1)}
                aria-label="Previous year"
                className="rounded-full p-1.5 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-[15px] font-bold text-ink">{year}</span>
              <button
                type="button"
                onClick={() => setYear((y) => y + 1)}
                aria-label="Next year"
                className="rounded-full p-1.5 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {MONTHS.map((name, index) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setMonth(index);
                    setPickingMonth(false);
                  }}
                  className={cn(
                    'rounded-md py-1.5 text-[12px] font-bold transition-colors',
                    index === month
                      ? 'bg-brand text-brand-fg'
                      : 'text-ink hover:bg-surface-sunken',
                  )}
                >
                  {name.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3.5">
        <span className="text-[15px] font-semibold text-ink">Time</span>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md bg-surface-sunken px-2 py-1 text-[15px] font-semibold text-ink">
            <input
              type="text"
              inputMode="numeric"
              aria-label="Hour"
              value={String(hours12).padStart(2, '0')}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, '').slice(0, 2);
                // Empty or 0 would produce an unreadable time, so the field
                // clamps into range instead of allowing a broken intermediate.
                const parsed = Math.min(Math.max(Number(digits) || 12, 1), 12);
                commit({ hour12: parsed });
              }}
              className="w-6 bg-transparent text-center outline-none"
            />
            <span className="opacity-60">:</span>
            <input
              type="text"
              inputMode="numeric"
              aria-label="Minute"
              value={String(minutes).padStart(2, '0')}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, '').slice(0, 2);
                commit({ minute: Math.min(Number(digits) || 0, 59) });
              }}
              className="w-6 bg-transparent text-center outline-none"
            />
          </div>

          <div
            role="group"
            aria-label="AM or PM"
            className="flex rounded-md bg-surface-sunken p-[2px] text-[12px] font-semibold"
          >
            {([false, true] as const).map((pm) => (
              <button
                key={pm ? 'PM' : 'AM'}
                type="button"
                aria-pressed={isPm === pm}
                onClick={() => commit({ pm })}
                className={cn(
                  'rounded px-2.5 py-1 transition-colors',
                  isPm === pm ? 'bg-surface text-ink shadow-soft' : 'text-ink-muted',
                )}
              >
                {pm ? 'PM' : 'AM'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
