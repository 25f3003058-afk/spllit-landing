'use client';

import Link from 'next/link';
import { MessageCircle, Navigation } from 'lucide-react';

import { config } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { LAYERS } from '@/lib/map/config';
import { entityDomainId } from '@/lib/map/adapters';
import type { MapEntity } from '@/lib/map/types';

/**
 * Marker preview — bottom sheet on mobile, floating side panel on desktop.
 * The sheet never covers the whole viewport: the map stays visible and
 * interactive behind it (Section 6.2).
 */
export function EntityPreview({
  entity,
  onClose,
}: {
  entity: MapEntity | null;
  onClose: () => void;
}) {
  const layer = entity ? LAYERS[entity.layer] : null;
  const domainId = entity ? entityDomainId(entity.id) : null;

  const directionsHref = entity
    ? `https://www.google.com/maps/dir/?api=1&destination=${entity.position[1]},${entity.position[0]}`
    : '#';

  // Chat context is derived from the marker layer so one sheet serves rides,
  // squads and events without branching into three components.
  const chatHref =
    entity && domainId
      ? entity.layer === 'squads'
        ? `/chat?context=squad&id=${domainId}`
        : entity.layer === 'rides'
          ? `/chat?context=ride&id=${domainId}`
          : null
      : null;

  return (
    <Sheet
      open={Boolean(entity)}
      onClose={onClose}
      // Backdrop must not swallow map interaction while a preview is open.
      dismissOnBackdrop={false}
    >
      {entity && layer ? (
        <div>
          <div className="flex items-start gap-3">
            <span
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold uppercase text-white"
              style={{ backgroundColor: layer.color }}
            >
              {entity.title.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold leading-tight text-ink">
                {entity.title}
              </p>
              {entity.subtitle ? (
                <p className="mt-1 text-[13px] text-ink-muted">{entity.subtitle}</p>
              ) : null}
              <p className="mt-1 text-[11px] uppercase tracking-[0.06em] text-ink-subtle">
                {layer.label}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {entity.href ? (
              <Link href={entity.href} className="col-span-1">
                <Button size="sm" className="w-full">
                  Open
                </Button>
              </Link>
            ) : null}

            {chatHref ? (
              <Link href={chatHref}>
                <Button size="sm" variant="secondary" className="w-full">
                  <MessageCircle className="h-3.5 w-3.5" />
                  Chat
                </Button>
              </Link>
            ) : null}

            <a
              href={directionsHref}
              target="_blank"
              rel="noopener noreferrer"
              className={chatHref && entity.href ? '' : 'col-span-2'}
            >
              <Button size="sm" variant="secondary" className="w-full">
                <Navigation className="h-3.5 w-3.5" />
                Directions
              </Button>
            </a>
          </div>

          {!config.mapbox.token ? (
            <p className="mt-4 text-[12px] text-ink-subtle">
              Set NEXT_PUBLIC_MAPBOX_TOKEN to enable in-app directions.
            </p>
          ) : null}
        </div>
      ) : null}
    </Sheet>
  );
}
