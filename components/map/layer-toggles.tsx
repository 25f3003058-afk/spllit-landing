'use client';

import { cn } from '@/lib/utils';
import { ACTIVE_LAYERS, type LayerKey } from '@/lib/map/config';

/**
 * Layer filter chips. State is owned by the page and mirrored into the URL so
 * a filtered map view is shareable and survives a reload (Section 6.2).
 */
export function LayerToggles({
  active,
  onToggle,
  className,
}: {
  active: LayerKey[];
  onToggle: (key: LayerKey) => void;
  className?: string;
}) {
  return (
    <div className={cn('no-scrollbar flex gap-1.5 overflow-x-auto', className)}>
      {ACTIVE_LAYERS.map((layer) => {
        const on = active.includes(layer.key);
        return (
          <button
            key={layer.key}
            onClick={() => onToggle(layer.key)}
            aria-pressed={on}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5',
              'text-[12.5px] font-medium transition-all duration-snap',
              on
                ? 'border-transparent bg-ink text-canvas shadow-soft'
                : 'glass border-line text-ink-muted hover:text-ink',
            )}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: on ? 'currentColor' : layer.color }}
            />
            {layer.label}
          </button>
        );
      })}
    </div>
  );
}
