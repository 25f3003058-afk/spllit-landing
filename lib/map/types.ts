import type { LayerKey } from '@/lib/map/config';
import type { LngLat } from '@/types';

/**
 * The normalised shape every map marker is built from. Services map their
 * domain objects into this — the map component never knows about Ride, Squad
 * or Event directly, which is what lets a new Phase 2 type register a layer
 * without touching the map itself.
 */
/**
 * Marker vocabulary, from the squad spec's marker table.
 *
 * `pin` is the default card marker used everywhere else; the rest exist so a
 * squad map reads at a glance without a legend.
 */
export type MarkerKind =
  | 'pin'
  /** Squad leader — crowned. */
  | 'leader'
  /** Squad member. */
  | 'member'
  /** Along for the ride, no squad powers. */
  | 'guest'
  /** Where everyone is converging. */
  | 'meeting'
  /** Where the squad goes after meeting. */
  | 'destination';

export interface MapEntity {
  id: string;
  layer: LayerKey;
  position: LngLat;
  title: string;
  /** Short secondary line — "6 members", "Leaving in 12 min". */
  subtitle?: string | null;
  /** Renders the pulsing live dot on the marker. */
  live?: boolean;
  /**
   * Overrides the layer's colour for this one pin.
   *
   * Layers answer "what kind of thing is this"; on the trip planner every pin
   * is the same kind of thing (a person) and the colour has to carry a
   * different axis — whether they host a ride, are riding along, or are merely
   * online. Without this the whole search comes back one indistinguishable
   * colour.
   */
  accent?: string;
  /**
   * Marker shape. Layers answer "what kind of thing"; this answers "what is
   * its role in the scene" — a squad leader and a plain member are the same
   * layer but must never look the same on the map.
   */
  marker?: MarkerKind;
  imageUrl?: string | null;
  /** Route to open when the preview card's primary action is used. */
  href?: string;
  /**
   * Detail rows for the preview sheet, in display order.
   *
   * Deliberately generic label/value pairs rather than squad-specific fields:
   * the sheet renders whatever a layer supplies, so adding rows to rides or
   * events later needs no change here or in the component.
   */
  facts?: { label: string; value: string }[];
}

export interface RouteGeometry {
  /** GeoJSON LineString coordinates, [lng, lat] pairs. */
  coordinates: LngLat[];
  distanceMetres?: number;
  durationSeconds?: number;
}
