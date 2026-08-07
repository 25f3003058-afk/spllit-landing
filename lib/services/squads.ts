import { api } from '@/lib/api/client';
import type { LngLat, Paginated, Squad, SquadJoinRequest, SquadProgress, SquadRole } from '@/types';

export interface SquadQuery {
  near?: LngLat;
  radiusKm?: number;
  college?: string;
  cursor?: string;
  limit?: number;
}

export interface CreateSquadInput {
  name: string;
  description?: string;
  visibility?: 'public' | 'private';
  college?: string;
  meetingPoint?: { lat: number; lng: number; label?: string };
  meetingAt?: string;
}

export const squadsService = {
  nearby: (query: SquadQuery = {}) =>
    api.get<Paginated<Squad>>('/squads/nearby', {
      query: {
        lng: query.near?.[0],
        lat: query.near?.[1],
        radiusKm: query.radiusKm ?? 10,
        college: query.college,
        cursor: query.cursor,
        limit: query.limit ?? 20,
      },
    }),

  mine: () => api.get<Squad[]>('/squads/mine'),

  byId: (id: string) => api.get<Squad>(`/squads/${id}`),

  create: (input: CreateSquadInput) => api.post<Squad>('/squads', input),

  join: (id: string) => api.post<Squad>(`/squads/${id}/join`),

  leave: (id: string) => api.post<void>(`/squads/${id}/leave`),

  /**
   * Leader-only. Authorisation is enforced by the server; the UI also hides the
   * control, but that is presentation, not security.
   */
  setMeetingPoint: (
    id: string,
    point: { lat: number; lng: number; label?: string },
    meetingAt?: string,
  ) => api.patch<Squad>(`/squads/${id}/meeting-point`, { ...point, meetingAt }),
};

/**
 * Squad membership, roles and live progress.
 *
 * Separate from `squadsService` above, which covers discovery and the squad
 * record. These map to /api/squads/... paths served by the member router.
 */
export const squadMembersService = {
  joinByCode: (code: string) =>
    api.post<{ squadId: string; status: 'active' | 'pending' }>('/squads/join-by-code', {
      code,
    }),

  requests: (squadId: string) =>
    api.get<SquadJoinRequest[]>(`/squads/${squadId}/requests`),

  decide: (squadId: string, memberId: string, decision: 'approve' | 'reject') =>
    api.post<{ id: string; decision: string }>(`/squads/${squadId}/requests/${memberId}`, {
      decision,
    }),

  setRole: (squadId: string, userId: string, role: SquadRole) =>
    api.patch<{ userId: string; role: SquadRole }>(`/squads/${squadId}/members/${userId}`, {
      role,
    }),

  remove: (squadId: string, userId: string) =>
    api.delete<void>(`/squads/${squadId}/members/${userId}`),

  /**
   * Reports the caller's own position. There is no user id in the path — the
   * server writes whoever is authenticated, so this cannot move anyone else.
   */
  reportPosition: (
    squadId: string,
    input: { lat: number; lng: number; battery?: number; network?: string },
  ) =>
    api.post<{ arrived: boolean; distanceMetres: number | null }>(
      `/squads/${squadId}/position`,
      input,
    ),

  progress: (squadId: string) => api.get<SquadProgress>(`/squads/${squadId}/progress`),
};
