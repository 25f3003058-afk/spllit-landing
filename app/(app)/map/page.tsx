'use client';

import { useCallback, useMemo, useState } from 'react';
import { Crosshair, Layers, MapPinOff } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import { config } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { MapCanvas } from '@/components/map/map-canvas';
import { LayerToggles } from '@/components/map/layer-toggles';
import { EntityPreview } from '@/components/map/entity-preview';
import { DEFAULT_LAYERS, type LayerKey } from '@/lib/map/config';
import {
  eventToEntity,
  rideToEntity,
  squadToEntity,
  personToEntity,
} from '@/lib/map/adapters';
import type { MapEntity } from '@/lib/map/types';
import { useGeolocation } from '@/lib/hooks/use-geolocation';
import { useEvents, useNearbyPeople, useRides, useSquads } from '@/lib/hooks/queries';
import { useLivePositions } from '@/lib/live/use-live';
import { rooms } from '@/lib/live/socket';

/**
 * Fullscreen explore map. Layer state is mirrored into the URL so a filtered
 * view is shareable and survives a reload.
 */
export default function MapPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { center, status, request } = useGeolocation({ watch: true });

  const layerParam = params.get('layers');
  const activeLayers = useMemo<LayerKey[]>(() => {
    if (!layerParam) return DEFAULT_LAYERS;
    const parsed = layerParam.split(',').filter(Boolean) as LayerKey[];
    return parsed.length > 0 ? parsed : DEFAULT_LAYERS;
  }, [layerParam]);

  const [selected, setSelected] = useState<MapEntity | null>(null);
  const [showLayers, setShowLayers] = useState(true);

  const enabled = Boolean(center);
  const rides = useRides({ near: center ?? undefined, limit: 60 }, enabled && activeLayers.includes('rides'));
  const squads = useSquads({ near: center ?? undefined, limit: 60 }, enabled && activeLayers.includes('squads'));
  const events = useEvents({ near: center ?? undefined, limit: 60 }, enabled && activeLayers.includes('events'));
  const people = useNearbyPeople(activeLayers.includes('friends') ? center : null);

  // Subscribe only to what is actually on screen — never the whole platform.
  const liveRooms = useMemo(
    () => (people.data ?? []).slice(0, 40).map((person) => rooms.user(person.id)),
    [people.data],
  );
  const livePositions = useLivePositions(liveRooms);

  const entities = useMemo<MapEntity[]>(() => {
    const out: MapEntity[] = [];

    for (const ride of rides.data?.items ?? []) {
      const entity = rideToEntity(ride);
      if (entity) out.push(entity);
    }
    for (const squad of squads.data?.items ?? []) {
      const entity = squadToEntity(squad);
      if (entity) out.push(entity);
    }
    for (const event of events.data?.items ?? []) {
      out.push(eventToEntity(event));
    }
    // People only get a marker once we have a live position for them —
    // a friend without a broadcast position has no place on the map.
    for (const person of people.data ?? []) {
      const position = livePositions.get(person.id);
      if (position) out.push(personToEntity(person, [position.lng, position.lat]));
    }

    return out;
  }, [rides.data, squads.data, events.data, people.data, livePositions]);

  const toggleLayer = useCallback(
    (key: LayerKey) => {
      const next = activeLayers.includes(key)
        ? activeLayers.filter((l) => l !== key)
        : [...activeLayers, key];
      const search = new URLSearchParams(params.toString());
      search.set('layers', next.join(','));
      router.replace(`/map?${search.toString()}`, { scroll: false });
    },
    [activeLayers, params, router],
  );

  if (!config.mapbox.token) {
    return (
      <div className="flex h-[calc(100dvh-4rem)] items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <MapPinOff className="mx-auto h-6 w-6 text-ink-subtle" />
          <p className="mt-4 font-display text-[15px] font-semibold text-ink">
            Map unavailable
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
            NEXT_PUBLIC_MAPBOX_TOKEN is not set for this environment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100dvh-4rem)] w-full">
      <MapCanvas
        mode="explore"
        layers={activeLayers}
        entities={entities}
        livePositions={livePositions}
        center={center}
        selectedId={selected?.id ?? null}
        onSelect={setSelected}
      />

      {/* Floating chrome. Sits above the canvas without blocking pan gestures
          outside the controls themselves. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 p-4">
        <div className="pointer-events-auto flex items-start gap-2">
          <button
            onClick={() => setShowLayers((v) => !v)}
            aria-label="Toggle layer filters"
            aria-pressed={showLayers}
            className="glass flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink shadow-float"
          >
            <Layers className="h-4 w-4" />
          </button>

          {showLayers ? (
            <LayerToggles active={activeLayers} onToggle={toggleLayer} className="flex-1" />
          ) : null}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-28 right-4 lg:bottom-6">
        <button
          onClick={request}
          aria-label="Centre on my location"
          className="pointer-events-auto glass flex h-11 w-11 items-center justify-center rounded-full text-ink shadow-float transition-transform duration-snap active:scale-95"
        >
          <Crosshair className="h-[18px] w-[18px]" />
        </button>
      </div>

      {status === 'denied' ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-28 flex justify-center px-4 lg:bottom-6">
          <div className="glass pointer-events-auto flex items-center gap-3 rounded-full py-2 pl-4 pr-2 shadow-float">
            <span className="text-[12.5px] text-ink-muted">
              Showing {config.defaultLocation.label} — location is off.
            </span>
            <Button size="sm" variant="secondary" onClick={request}>
              Enable
            </Button>
          </div>
        </div>
      ) : null}

      <EntityPreview entity={selected} onClose={() => setSelected(null)} origin={center} />
    </div>
  );
}
