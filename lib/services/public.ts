import { api } from '@/lib/api/client';
import type { LngLat } from '@/types';

/**
 * Pre-auth endpoints. Everything here is anonymous by construction — the
 * backend must not return identities, exact positions or anything that could
 * deanonymise a user to a logged-out visitor.
 */

export interface PreviewMarker {
  id: string;
  /** Category only — never a user or a specific ride id. */
  kind: 'ride' | 'squad' | 'event';
  /**
   * Coarsened position. The server snaps to a ~250 m grid before returning, so
   * a marker indicates activity in an area rather than a person at a place.
   */
  position: LngLat;
  /** Aggregate count in that cell, e.g. "3 squads active here". */
  count: number;
}

export interface PlatformStats {
  activeRides: number;
  activeSquads: number;
  upcomingEvents: number;
  colleges: number;
}

export const publicService = {
  /**
   * Aggregated, coarsened activity for the landing map. If the backend has no
   * activity to report it returns an empty array — the landing map then renders
   * empty rather than showing invented markers.
   */
  mapPreview: (near?: LngLat) =>
    api.get<PreviewMarker[]>('/public/map-preview', {
      anonymous: true,
      query: { lng: near?.[0], lat: near?.[1] },
    }),

  /**
   * Real platform counters. The landing page omits the social-proof line
   * entirely when this fails or returns zeros — no invented numbers.
   */
  stats: () => api.get<PlatformStats>('/public/stats', { anonymous: true }),
};
