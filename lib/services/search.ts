import { api } from '@/lib/api/client';
import type { LngLat, SearchResults, SearchTab } from '@/types';

export const searchService = {
  /**
   * Server-side search across every entity type plus Mapbox geocoding.
   * Deliberately one round trip: the backend fans out and merges, so the client
   * never filters a local array (Section 5.12).
   */
  all: (q: string, near?: LngLat) =>
    api.get<SearchResults>('/search', {
      query: { q, lng: near?.[0], lat: near?.[1] },
    }),

  tab: (q: string, tab: SearchTab, near?: LngLat) =>
    api.get<SearchResults>('/search', {
      query: { q, tab, lng: near?.[0], lat: near?.[1] },
    }),
};
