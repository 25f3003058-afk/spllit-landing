'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { createRoot, type Root } from 'react-dom/client';

import 'mapbox-gl/dist/mapbox-gl.css';

import { config } from '@/lib/config';
import { cn } from '@/lib/utils';
import {
  CAMERA,
  CLUSTER_MAX_ZOOM,
  CLUSTER_RADIUS,
  DEFAULT_CENTER,
  LAYER_IDS,
  SOURCE_IDS,
  styleForTheme,
  type LayerKey,
  type MapMode,
} from '@/lib/map/config';
import type { MapEntity, RouteGeometry } from '@/lib/map/types';
import { MarkerCard, SelfMarker } from '@/components/map/marker-card';
import type { LngLat, LivePosition } from '@/types';

export interface SplitMapProps {
  mode?: MapMode;
  /** Which marker categories to render. Entities outside this set are ignored. */
  layers: LayerKey[];
  /** Markers to draw. The map never fetches — the parent owns the data. */
  entities: MapEntity[];
  /** Live positions keyed by user id, drawn as moving pucks. */
  livePositions?: Map<string, LivePosition>;
  /** Route line, e.g. driver → pickup → destination. */
  route?: RouteGeometry | null;
  center?: LngLat | null;
  zoom?: number;
  selectedId?: string | null;
  onSelect?: (entity: MapEntity | null) => void;
  /** Fires on user-driven camera changes so the parent can refetch by bounds. */
  onBoundsChange?: (bounds: [number, number, number, number]) => void;
  /**
   * Fires when the user clicks empty map, for drop-a-pin flows. Clicks that
   * land on a cluster or a marker are consumed by those and never arrive here
   * — picking a meeting point must not be triggered by aiming at someone.
   */
  onMapClick?: (point: LngLat) => void;
  interactive?: boolean;
  className?: string;
  /** Renders the user's own position puck. */
  showSelf?: boolean;
}

interface MarkerHandle {
  marker: mapboxgl.Marker;
  root: Root;
  container: HTMLElement;
}

/**
 * Tears down one marker.
 *
 * The GL marker goes immediately so it disappears from the map on the same
 * frame, but the React root is unmounted in a microtask. Each marker is its
 * own root, and unmounting one synchronously from an effect that is running
 * inside the parent's commit throws "Attempted to synchronously unmount a root
 * while React was already rendering". Deferring puts it after the commit.
 */
function disposeMarker(handle: MarkerHandle) {
  handle.marker.remove();
  queueMicrotask(() => handle.root.unmount());
}

function toFeatureCollection(entities: MapEntity[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: entities.map((entity) => ({
      type: 'Feature',
      id: entity.id,
      geometry: { type: 'Point', coordinates: entity.position },
      properties: { entityId: entity.id, layer: entity.layer },
    })),
  };
}

/**
 * The single map component. `/map`, ride detail, squad detail and event detail
 * all render this — differentiated by `mode` and `layers`, never forked into
 * separate implementations (Section 6.2).
 *
 * Lifecycle contract: the GL instance is created exactly once per mount and
 * torn down completely on unmount, including every HTML marker root. Repeated
 * navigation in and out of a map route must not leak listeners or duplicate
 * markers.
 */
export function SplitMap({
  mode = 'explore',
  layers,
  entities,
  livePositions,
  route,
  center,
  zoom,
  selectedId = null,
  onSelect,
  onBoundsChange,
  onMapClick,
  interactive = true,
  className,
  showSelf = true,
}: SplitMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, MarkerHandle>>(new Map());
  const liveMarkersRef = useRef<Map<string, MarkerHandle>>(new Map());
  const [ready, setReady] = useState(false);

  // Selection and callbacks are read through refs inside GL event handlers so
  // the map is never re-initialised when a parent re-renders.
  //
  // The refs are synced in an effect rather than assigned during render:
  // mutating a ref while rendering is unsafe under concurrent rendering, where
  // a render can be discarded and replayed. This effect is declared before
  // every other one in the component so the refs are current by the time any
  // later effect reads them.
  const selectedRef = useRef(selectedId);
  const onSelectRef = useRef(onSelect);
  const onBoundsRef = useRef(onBoundsChange);
  const onMapClickRef = useRef(onMapClick);

  const visible = useMemo(
    () => entities.filter((e) => layers.includes(e.layer)),
    [entities, layers],
  );
  const visibleRef = useRef(visible);

  useEffect(() => {
    selectedRef.current = selectedId;
    onSelectRef.current = onSelect;
    onBoundsRef.current = onBoundsChange;
    onMapClickRef.current = onMapClick;
    visibleRef.current = visible;
  });

  // --- init (once per mount) ----------------------------------------------
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (!config.mapbox.token) {
      // Without a token GL would throw on construction; the skeleton stays up
      // and the caller's fallback copy explains why.
      return;
    }

    mapboxgl.accessToken = config.mapbox.token;

    const dark =
      typeof document !== 'undefined' &&
      document.documentElement.classList.contains('dark');

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: styleForTheme(dark),
      center: center ?? DEFAULT_CENTER,
      zoom: zoom ?? CAMERA[mode].zoom,
      pitch: CAMERA[mode].pitch,
      interactive,
      attributionControl: false,
      // Keeps the initial paint cheap on low-end devices and 3G.
      antialias: false,
      fadeDuration: 120,
    });

    mapRef.current = map;

    map.on('load', () => {
      map.addSource(SOURCE_IDS.entities, {
        type: 'geojson',
        data: toFeatureCollection(visibleRef.current),
        cluster: true,
        clusterRadius: CLUSTER_RADIUS,
        clusterMaxZoom: CLUSTER_MAX_ZOOM,
      });

      map.addLayer({
        id: LAYER_IDS.clusters,
        type: 'circle',
        source: SOURCE_IDS.entities,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#00c853',
          'circle-opacity': 0.92,
          'circle-radius': ['step', ['get', 'point_count'], 18, 10, 24, 30, 30],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
        },
      });

      map.addLayer({
        id: LAYER_IDS.clusterCount,
        type: 'symbol',
        source: SOURCE_IDS.entities,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 13,
        },
        paint: { 'text-color': '#ffffff' },
      });

      // Route line drawn under markers, with a casing for legibility on
      // busy basemaps.
      map.addSource(SOURCE_IDS.route, {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } },
      });

      map.addLayer(
        {
          id: LAYER_IDS.routeCasing,
          type: 'line',
          source: SOURCE_IDS.route,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#ffffff', 'line-width': 8, 'line-opacity': 0.9 },
        },
        LAYER_IDS.clusters,
      );

      map.addLayer(
        {
          id: LAYER_IDS.routeLine,
          type: 'line',
          source: SOURCE_IDS.route,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#00c853', 'line-width': 4 },
        },
        LAYER_IDS.clusters,
      );

      setReady(true);
    });

    // Expanding a cluster zooms into it rather than opening a list.
    map.on('click', LAYER_IDS.clusters, (event) => {
      const feature = map.queryRenderedFeatures(event.point, {
        layers: [LAYER_IDS.clusters],
      })[0];
      if (!feature) return;
      const clusterId = feature.properties?.cluster_id as number | undefined;
      if (clusterId === undefined) return;
      const source = map.getSource(SOURCE_IDS.entities) as mapboxgl.GeoJSONSource;
      source.getClusterExpansionZoom(clusterId, (error, nextZoom) => {
        if (error || nextZoom === null || nextZoom === undefined) return;
        const geometry = feature.geometry;
        if (geometry.type !== 'Point') return;
        map.easeTo({
          center: geometry.coordinates as [number, number],
          zoom: nextZoom,
          duration: 400,
        });
      });
    });

    map.on('mouseenter', LAYER_IDS.clusters, () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', LAYER_IDS.clusters, () => {
      // Restores the base cursor, which is a crosshair while the parent is
      // waiting for a pin drop — resetting to '' would silently cancel it.
      map.getCanvas().style.cursor = onMapClickRef.current ? 'crosshair' : '';
    });

    // Tapping empty map dismisses the preview card, and — where the parent
    // asked for it — reports the point so a pin can be dropped there.
    map.on('click', (event) => {
      const hits = map.queryRenderedFeatures(event.point, {
        layers: [LAYER_IDS.clusters],
      });
      if (hits.length > 0) return;
      if (selectedRef.current) onSelectRef.current?.(null);
      onMapClickRef.current?.([event.lngLat.lng, event.lngLat.lat]);
    });

    map.on('moveend', () => {
      if (!onBoundsRef.current) return;
      const b = map.getBounds();
      if (!b) return;
      onBoundsRef.current([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    });

    // Captured here rather than read in the cleanup: both Maps are created once
    // by useRef and never reassigned, so this is the same object either way.
    const markers = markersRef.current;
    const liveMarkers = liveMarkersRef.current;

    return () => {
      // Unmount every React root before removing the map, otherwise the roots
      // outlive their containers and React warns on the next mount.
      for (const handle of markers.values()) disposeMarker(handle);
      markers.clear();
      for (const handle of liveMarkers.values()) disposeMarker(handle);
      liveMarkers.clear();
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
    // Intentionally mount-only: camera/mode changes are applied by the effects
    // below rather than by rebuilding the GL context.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- entity source + HTML markers ---------------------------------------
  const syncMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource(SOURCE_IDS.entities) as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;

    // Only points that survived clustering get a card marker. Everything else
    // is represented by the cluster circle, so we never mount hundreds of DOM
    // nodes at low zoom.
    const rendered = map.querySourceFeatures(SOURCE_IDS.entities, {
      filter: ['!', ['has', 'point_count']],
    });

    const wanted = new Set<string>();
    for (const feature of rendered) {
      const id = feature.properties?.entityId as string | undefined;
      if (id) wanted.add(id);
    }

    const byId = new Map(visibleRef.current.map((e) => [e.id, e]));

    // Remove markers that clustered away or left the data set.
    for (const [id, handle] of markersRef.current) {
      if (!wanted.has(id)) {
        disposeMarker(handle);
        markersRef.current.delete(id);
      }
    }

    // Add or update the rest.
    for (const id of wanted) {
      const entity = byId.get(id);
      if (!entity) continue;

      let handle = markersRef.current.get(id);
      if (!handle) {
        const container = document.createElement('div');
        const root = createRoot(container);
        const marker = new mapboxgl.Marker({ element: container, anchor: 'bottom' })
          .setLngLat(entity.position)
          .addTo(map);
        handle = { marker, root, container };
        markersRef.current.set(id, handle);
      } else {
        handle.marker.setLngLat(entity.position);
      }

      handle.root.render(
        <MarkerCard
          entity={entity}
          selected={selectedRef.current === entity.id}
          onSelect={() => onSelectRef.current?.(entity)}
        />,
      );
    }
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const source = map.getSource(SOURCE_IDS.entities) as mapboxgl.GeoJSONSource | undefined;
    source?.setData(toFeatureCollection(visible));
    // Clustering is recomputed asynchronously; sync once the source settles.
    map.once('idle', syncMarkers);
  }, [visible, ready, syncMarkers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.on('move', syncMarkers);
    map.on('idle', syncMarkers);
    syncMarkers();
    return () => {
      map.off('move', syncMarkers);
      map.off('idle', syncMarkers);
    };
  }, [ready, syncMarkers]);

  // Re-render markers when the selection changes, without touching the source.
  useEffect(() => {
    if (!ready) return;
    syncMarkers();
  }, [selectedId, ready, syncMarkers]);

  // --- live position pucks -------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !livePositions) return;

    const seen = new Set<string>();
    for (const [userId, position] of livePositions) {
      seen.add(userId);
      let handle = liveMarkersRef.current.get(userId);
      if (!handle) {
        const container = document.createElement('div');
        const root = createRoot(container);
        const marker = new mapboxgl.Marker({ element: container })
          .setLngLat([position.lng, position.lat])
          .addTo(map);
        handle = { marker, root, container };
        liveMarkersRef.current.set(userId, handle);
      } else {
        // setLngLat on an existing marker animates via CSS transform rather
        // than remounting the node — this is what keeps movement smooth.
        handle.marker.setLngLat([position.lng, position.lat]);
      }
      handle.root.render(<SelfMarker heading={position.heading} />);
    }

    for (const [userId, handle] of liveMarkersRef.current) {
      if (!seen.has(userId)) {
        disposeMarker(handle);
        liveMarkersRef.current.delete(userId);
      }
    }
  }, [livePositions, ready]);

  // --- pin-drop affordance -------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.getCanvas().style.cursor = onMapClick ? 'crosshair' : '';
  }, [onMapClick, ready]);

  // --- route ---------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const source = map.getSource(SOURCE_IDS.route) as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;

    // Updating the source data in place means the line never flickers or
    // remounts when a route is recalculated.
    source.setData({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: route?.coordinates ?? [] },
    });
  }, [route, ready]);

  // --- camera --------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center) return;
    map.easeTo({
      center,
      zoom: zoom ?? map.getZoom(),
      duration: 700,
      essential: true,
    });
  }, [center, zoom]);

  // --- self puck -----------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !showSelf || !center) return;

    const container = document.createElement('div');
    const root = createRoot(container);
    root.render(<SelfMarker heading={null} />);
    const marker = new mapboxgl.Marker({ element: container }).setLngLat(center).addTo(map);

    return () => {
      marker.remove();
      queueMicrotask(() => root.unmount());
    };
  }, [ready, showSelf, center]);

  return (
    <div
      ref={containerRef}
      className={cn('h-full w-full', className)}
      // The GL canvas paints its own background; this avoids a white flash
      // between mount and first paint.
      style={{ backgroundColor: 'var(--surface-sunken)' }}
    />
  );
}

export default SplitMap;
