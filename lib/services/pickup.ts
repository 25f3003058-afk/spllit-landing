import { api } from '@/lib/api/client';
import type { RoadSnap } from '@/lib/pickup-advice';
import type { LngLat } from '@/types';

export const pickupService = {
  /**
   * The nearest road a car can use, and how far the pin is from it.
   *
   * Server-side because the road lookup needs the secret token, and because one
   * cached answer serves everyone looking at the same meeting point. Never
   * rejects on a Mapbox failure — the endpoint answers `unavailable`, which
   * renders as nothing at all rather than as a claim about the place.
   */
  nearestRoad: (point: LngLat) =>
    api.get<RoadSnap>('/pickup', { query: { lng: point[0], lat: point[1] } }),
};
