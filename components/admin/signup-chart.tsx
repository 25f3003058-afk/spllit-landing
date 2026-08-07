'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils';

/**
 * 14-day signup trend. One series, so no legend box — the heading names it.
 *
 * Colour is `--chart-1`, not the brand green: brand green measures 2.18:1
 * against a light chart surface, which fails the 3:1 floor. `--chart-1` is a
 * validated step per mode (lightness band, chroma floor, contrast), re-stepped
 * for dark rather than flipped.
 */
export function SignupChart({ data }: { data: { date: string; count: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);

  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (asTable) {
    return (
      <figure className="m-0">
        <Header total={total} asTable onToggle={() => setAsTable(false)} />
        <div className="max-h-[180px] overflow-y-auto rounded-md border border-line">
          <table className="w-full text-left text-[12.5px]">
            <thead className="sticky top-0 bg-surface-sunken">
              <tr>
                <th className="px-3 py-2 font-medium text-ink-muted">Date</th>
                <th className="px-3 py-2 text-right font-medium text-ink-muted">Signups</th>
              </tr>
            </thead>
            <tbody>
              {data.map((point) => (
                <tr key={point.date} className="border-t border-line">
                  <td className="px-3 py-1.5 text-ink">{formatDay(point.date)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-ink">
                    {point.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </figure>
    );
  }

  return (
    <figure className="m-0">
      <Header total={total} asTable={false} onToggle={() => setAsTable(true)} />

      <div className="relative">
        {/* Recessive baseline only — no full grid for a 14-bar series. */}
        <div
          className="flex h-[120px] items-end gap-[2px]"
          style={{ borderBottom: '1px solid var(--chart-grid)' }}
          role="img"
          aria-label={`Signups per day over the last 14 days, ${total} total`}
        >
          {data.map((point, index) => {
            const height = (point.count / max) * 100;
            return (
              <button
                key={point.date}
                type="button"
                onMouseEnter={() => setHover(index)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(index)}
                onBlur={() => setHover(null)}
                // Hit target spans the full column height, not just the bar.
                className="group relative flex h-full flex-1 items-end"
                aria-label={`${formatDay(point.date)}: ${point.count} signups`}
              >
                <span
                  className="w-full rounded-t-[4px] transition-opacity duration-snap"
                  style={{
                    height: `${Math.max(height, point.count > 0 ? 4 : 1)}%`,
                    backgroundColor:
                      point.count > 0 ? 'var(--chart-1)' : 'var(--chart-grid)',
                    opacity: hover === null || hover === index ? 1 : 0.45,
                  }}
                />

                {hover === index ? (
                  <span
                    className={cn(
                      'pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2',
                      'whitespace-nowrap rounded-md border border-line bg-surface px-2 py-1',
                      'text-[11px] shadow-float',
                    )}
                  >
                    <span className="font-semibold tabular-nums text-ink">{point.count}</span>{' '}
                    <span className="text-ink-muted">{formatDay(point.date)}</span>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Only the endpoints are labelled — a tick per bar would be noise. */}
        <div className="mt-1.5 flex justify-between text-[10.5px] text-ink-subtle">
          <span>{formatDay(data[0]?.date ?? '')}</span>
          <span>{formatDay(data[data.length - 1]?.date ?? '')}</span>
        </div>
      </div>
    </figure>
  );
}

function Header({
  total,
  asTable,
  onToggle,
}: {
  total: number;
  asTable: boolean;
  onToggle: () => void;
}) {
  return (
    <figcaption className="mb-4 flex items-baseline justify-between gap-3">
      <div>
        <h3 className="font-display text-[15px] font-semibold text-ink">New signups</h3>
        <p className="mt-0.5 text-[12.5px] text-ink-muted">
          <span className="font-semibold tabular-nums text-ink">{total}</span> in the last
          14 days
        </p>
      </div>
      <button
        onClick={onToggle}
        className="shrink-0 text-[11.5px] font-medium text-ink-subtle transition-colors hover:text-ink"
      >
        {asTable ? 'Chart' : 'Table'}
      </button>
    </figcaption>
  );
}

function formatDay(iso: string): string {
  if (!iso) return '';
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
