'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  suffix?: ReactNode;
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, icon, suffix, invalid, ...props },
  ref,
) {
  return (
    <div
      className={cn(
        'flex h-11 items-center gap-2.5 rounded-lg border bg-surface px-3.5',
        'transition-colors duration-snap focus-within:border-brand',
        invalid ? 'border-danger' : 'border-line',
        className,
      )}
    >
      {icon ? <span className="shrink-0 text-ink-subtle">{icon}</span> : null}
      <input
        ref={ref}
        className={cn(
          'w-full bg-transparent text-sm text-ink outline-none',
          'placeholder:text-ink-subtle disabled:cursor-not-allowed disabled:opacity-60',
        )}
        {...props}
      />
      {suffix ? <span className="shrink-0">{suffix}</span> : null}
    </div>
  );
});

/**
 * Caption + hint/error around a control.
 *
 * The root is a <div>, not a <label>. A label may wrap exactly one labelable
 * element and no other interactive content — wrapping PlacePicker, which is an
 * input *plus* a list of buttons, made the browser forward suggestion clicks to
 * the input instead of the button. Places silently failed to get picked, which
 * is what left "Post ride" permanently disabled.
 *
 * Pass `htmlFor` (with a matching `id` on the control) for the simple
 * single-input case to keep click-the-caption-to-focus.
 */
export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="block">
      <label
        {...(htmlFor ? { htmlFor } : {})}
        className="mb-2 block text-[13px] font-medium text-ink"
      >
        {label}
      </label>
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-ink-subtle">{hint}</span>
      ) : null}
    </div>
  );
}
