import { config } from '@/lib/config';
import type { LngLat } from '@/types';

/**
 * The single map configuration. Every screen that renders a map imports from
 * here — style, camera defaults, layer ids and marker tokens are never
 * re-declared per page (Section 1, Section 6.2).
 */

export type MapMode =
  | 'explore'
  | 'focused-ride'
  | 'focused-squad'
  | 'focused-event'
  /** Landing page: low interactivity, no auth-gated actions. */
  | 'preview';

/** Marker categories. Adding a Phase 2 type means adding one entry here. */
export type LayerKey =
  | 'rides'
  | 'squads'
  | 'events'
  | 'communities'
  | 'friends'
  // Phase 2 — registered but not yet emitted by any service.
  | 'rentals'
  | 'marketplace';

export interface LayerConfig {
  key: LayerKey;
  label: string;
  /** CSS colour token used for the marker accent and cluster fill. */
  color: string;
  /** Whether the layer is on by default in explore mode. */
  defaultOn: boolean;
  /** Phase 2 layers render nothing until their services exist. */
  comingSoon?: boolean;
}

export const LAYERS: Record<LayerKey, LayerConfig> = {
  rides: { key: 'rides', label: 'Rides', color: 'var(--brand)', defaultOn: true },
  squads: { key: 'squads', label: 'Squads', color: 'var(--accent)', defaultOn: true },
  events: { key: 'events', label: 'Events', color: '#f5a524', defaultOn: true },
  communities: { key: 'communities', label: 'Communities', color: '#8b5cf6', defaultOn: false },
  friends: { key: 'friends', label: 'Friends', color: '#ec4899', defaultOn: true },
  rentals: {
    key: 'rentals',
    label: 'Rentals',
    color: '#64748b',
    defaultOn: false,
    comingSoon: true,
  },
  marketplace: {
    key: 'marketplace',
    label: 'Marketplace',
    color: '#64748b',
    defaultOn: false,
    comingSoon: true,
  },
};

export const ACTIVE_LAYERS = Object.values(LAYERS).filter((l) => !l.comingSoon);

export const DEFAULT_LAYERS: LayerKey[] = ACTIVE_LAYERS.filter((l) => l.defaultOn).map(
  (l) => l.key,
);

/** Stable ids so add/remove operations never guess at a name. */
export const SOURCE_IDS = {
  entities: 'spllit-entities',
  route: 'spllit-route',
} as const;

export const LAYER_IDS = {
  clusters: 'spllit-clusters',
  clusterCount: 'spllit-cluster-count',
  routeLine: 'spllit-route-line',
  routeCasing: 'spllit-route-casing',
} as const;

/** Camera presets per mode. */
export const CAMERA: Record<MapMode, { zoom: number; pitch: number }> = {
  explore: { zoom: 13, pitch: 0 },
  'focused-ride': { zoom: 14.5, pitch: 35 },
  'focused-squad': { zoom: 14, pitch: 20 },
  'focused-event': { zoom: 15, pitch: 20 },
  preview: { zoom: 12.2, pitch: 30 },
};

export const DEFAULT_CENTER: LngLat = [
  config.defaultLocation.lng,
  config.defaultLocation.lat,
];

/**
 * Below this many points we render individual HTML markers; above it Mapbox
 * clusters them server-side in the GL layer. Chosen so a dense campus still
 * shows real cards rather than a wall of overlapping pills.
 */
export const CLUSTER_THRESHOLD = 24;
export const CLUSTER_RADIUS = 56;
export const CLUSTER_MAX_ZOOM = 15;

export function styleForTheme(dark: boolean): string {
  return dark ? config.mapbox.styleDark : config.mapbox.styleLight;
}
