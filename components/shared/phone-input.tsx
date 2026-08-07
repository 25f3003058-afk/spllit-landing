'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  findCountry,
  searchCountries,
  type Country,
} from '@/content/countries';

/**
 * Phone field with a country-code selector. India is preselected.
 *
 * The value handed back is always E.164 (`+919876543210`) — Firebase rejects
 * anything else, and building it here means callers never have to guess how to
 * join the dial code to the number.
 */
export function PhoneInput({
  countryCode,
  onCountryChange,
  value,
  onChange,
  invalid,
  autoFocus,
}: {
  countryCode: string;
  onCountryChange: (code: string) => void;
  /** National number only — no dial code. */
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  autoFocus?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  const country = findCountry(countryCode);
  const results = searchCountries(query);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <div
        className={cn(
          'flex h-12 items-stretch overflow-hidden rounded-lg border bg-surface',
          'transition-colors duration-snap focus-within:border-brand',
          invalid ? 'border-danger' : 'border-line',
        )}
      >
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            setQuery('');
          }}
          aria-label={`Country code: ${country.name} ${country.dial}`}
          aria-expanded={open}
          className="flex shrink-0 items-center gap-1.5 border-r border-line px-3 text-sm transition-colors hover:bg-surface-sunken"
        >
          <span className="text-base leading-none">{country.flag}</span>
          <span className="font-medium tabular-nums text-ink">{country.dial}</span>
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 text-ink-subtle transition-transform duration-snap',
              open && 'rotate-180',
            )}
          />
        </button>

        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          autoFocus={autoFocus}
          placeholder={country.nsn === 10 ? '98765 43210' : 'Phone number'}
          value={value}
          // Digits only: users paste numbers with spaces, dashes and brackets,
          // and Firebase rejects all of them.
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 15))}
          className="w-full bg-transparent px-3.5 text-sm text-ink outline-none placeholder:text-ink-subtle"
        />
      </div>

      {open ? (
        <div className="absolute inset-x-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-lg border border-line bg-surface shadow-float">
          <div className="flex items-center gap-2 border-b border-line px-3">
            <Search className="h-3.5 w-3.5 shrink-0 text-ink-subtle" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country or code"
              className="h-10 w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-subtle"
            />
          </div>

          <ul className="max-h-[260px] overflow-y-auto py-1">
            {results.length === 0 ? (
              <li className="px-3.5 py-3 text-[13px] text-ink-subtle">No match</li>
            ) : (
              results.map((c: Country) => (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => {
                      onCountryChange(c.code);
                      setOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px]',
                      'transition-colors hover:bg-surface-sunken',
                      c.code === countryCode && 'bg-surface-sunken',
                    )}
                  >
                    <span className="text-base leading-none">{c.flag}</span>
                    <span className="min-w-0 flex-1 truncate text-ink">{c.name}</span>
                    <span className="shrink-0 tabular-nums text-ink-muted">{c.dial}</span>
                    {c.code === countryCode ? (
                      <Check className="h-3.5 w-3.5 shrink-0 text-brand" />
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/** Builds the E.164 string Firebase expects. */
export function toE164(countryCode: string, nationalNumber: string): string {
  const country = findCountry(countryCode);
  const digits = nationalNumber.replace(/\D/g, '');
  return `${country.dial}${digits}`;
}

/** Soft length check before we spend an SMS on it. */
export function isPlausiblePhone(countryCode: string, nationalNumber: string): boolean {
  const digits = nationalNumber.replace(/\D/g, '');
  const country = findCountry(countryCode);
  if (country.nsn) return digits.length === country.nsn;
  return digits.length >= 6 && digits.length <= 14;
}

export { DEFAULT_COUNTRY, COUNTRIES };
