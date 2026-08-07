import { api } from '@/lib/api/client';
import type { LngLat, Paginated, SpllitEvent } from '@/types';

export interface EventQuery {
  near?: LngLat;
  radiusKm?: number;
  college?: string;
  category?: string;
  from?: string;
  cursor?: string;
  limit?: number;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  venue: { lat: number; lng: number; label?: string; address?: string };
  startsAt: string;
  endsAt?: string;
  ticketType?: 'free' | 'paid';
  price?: number;
  capacity?: number;
  category?: string;
}

export const eventsService = {
  feed: (query: EventQuery = {}) =>
    api.get<Paginated<SpllitEvent>>('/events/feed', {
      query: {
        lng: query.near?.[0],
        lat: query.near?.[1],
        radiusKm: query.radiusKm ?? 25,
        college: query.college,
        category: query.category,
        from: query.from,
        cursor: query.cursor,
        limit: query.limit ?? 20,
      },
    }),

  byId: (id: string) => api.get<SpllitEvent>(`/events/${id}`),

  create: (input: CreateEventInput) => api.post<SpllitEvent>('/events', input),

  attend: (id: string, status: 'going' | 'interested' | 'cancelled' = 'going') =>
    api.post<SpllitEvent>(`/events/${id}/attend`, { status }),
};
