import { api } from '@/lib/api/client';
import type { HostDossier, RideCandidateResult, RideInvite, TripRequest } from '@/types';

export interface PublishTripInput {
  originLabel: string;
  originLat: number;
  originLng: number;
  destLabel: string;
  destLat: number;
  destLng: number;
  departAt: string;
  windowMins?: number;
  seats?: number;
}

export const tripsService = {
  /**
   * Publishes the caller's intent so hosts can find them. Idempotent by
   * design — one open request per person, so calling this again replaces the
   * previous plan rather than stacking another.
   */
  publish: (input: PublishTripInput) => api.post<TripRequest>('/trips/requests', input),

  /** The caller's open request, or null. */
  mine: () => api.get<TripRequest | null>('/trips/requests/mine'),

  withdraw: (id: string) => api.delete<void>(`/trips/requests/${id}`),

  invites: () => api.get<RideInvite[]>('/trips/invites'),

  accept: (id: string) =>
    api.post<{ id: string; status: 'accepted'; dossier: HostDossier | null; threadId: string }>(
      `/trips/invites/${id}/accept`,
    ),

  decline: (id: string) => api.post<void>(`/trips/invites/${id}/decline`),

  /** Host side: riders whose published trip fits this ride's corridor. */
  candidates: (rideId: string, corridorMetres?: number) =>
    api.get<RideCandidateResult>(`/rides/${rideId}/candidates`, {
      query: { corridorMetres },
    }),

  invite: (rideId: string, requestId: string) =>
    api.post<{ id: string; status: 'pending' }>(`/rides/${rideId}/invite`, { requestId }),
};
