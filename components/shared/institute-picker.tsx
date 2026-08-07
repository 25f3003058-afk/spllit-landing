'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Check, ChevronDown, Search } from 'lucide-react';

import { cn } from '@/lib/utils';
import { searchInstitutes, type Institute } from '@/content/institutes';

/**
 * Institute monogram.
 *
 * These are generated marks, NOT the institutes' official logos — those are
 * registered trademarks and cannot be redistributed here. If a licensed asset
 * is added to `institute.logo`, it renders instead and nothing else changes.
 */
export function InstituteMark({
  institute,
  size = 'md',
}: {
  institute: Institute;
  size?: 'sm' | 'md' | 'lg';
}) {
  const box = size === 'sm' ? 'h-8 w-8 text-[9px]' : size === 'lg' ? 'h-12 w-12 text-[12px]' : 'h-10 w-10 text-[10px]';
  const px = size === 'sm' ? 32 : size === 'lg' ? 48 : 40;

  if (institute.logo) {
    return (
      <Image
        src={institute.logo}
        alt={institute.name}
        width={px}
        height={px}
        className={cn('shrink-0 rounded-md object-contain', box)}
        style={{ width: px, height: px }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-md font-bold tracking-tight text-white',
        box,
      )}
      style={{ backgroundColor: institute.accent }}
    >
      {institute.code}
    </span>
  );
}

export function InstitutePicker({
  value,
  onChange,
  invalid,
}: {
  value: Institute | null;
  onChange: (institute: Institute) => void;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  const results = searchInstitutes(query);

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
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setQuery('');
        }}
        aria-expanded={open}
        className={cn(
          'flex h-12 w-full items-center gap-3 rounded-lg border bg-surface px-3 text-left',
          'transition-colors duration-snap hover:border-line-strong',
          invalid ? 'border-danger' : open ? 'border-brand' : 'border-line',
        )}
      >
        {value ? (
          <>
            <InstituteMark institute={value} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-ink">{value.name}</span>
              {value.city ? (
                <span className="block truncate text-[11.5px] text-ink-muted">{value.city}</span>
              ) : null}
            </span>
          </>
        ) : (
          <span className="flex-1 text-sm text-ink-subtle">Search your institute</span>
        )}
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-ink-subtle transition-transform duration-snap',
            open && 'rotate-180',
          )}
        />
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-lg border border-line bg-surface shadow-float">
          <div className="flex items-center gap-2 border-b border-line px-3">
            <Search className="h-3.5 w-3.5 shrink-0 text-ink-subtle" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="IIT, NIT, city or name"
              className="h-11 w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-subtle"
            />
          </div>

          <ul className="max-h-[300px] overflow-y-auto py-1">
            {results.length === 0 ? (
              <li className="px-3.5 py-4 text-[13px] text-ink-subtle">
                Nothing matched. Pick “Other institute” and tell us — we&apos;ll add it.
              </li>
            ) : (
              results.map((institute) => (
                <li key={institute.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(institute);
                      setOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-surface-sunken',
                      value?.id === institute.id && 'bg-surface-sunken',
                    )}
                  >
                    <InstituteMark institute={institute} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium text-ink">
                        {institute.name}
                      </span>
                      <span className="block truncate text-[11.5px] text-ink-muted">
                        {institute.city}
                        {institute.domains[0] ? ` · @${institute.domains[0]}` : ' · no verified domain'}
                      </span>
                    </span>
                    {value?.id === institute.id ? (
                      <Check className="h-4 w-4 shrink-0 text-brand" />
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
