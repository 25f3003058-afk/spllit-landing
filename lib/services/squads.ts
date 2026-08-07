import { api } from '@/lib/api/client';
import type {
  LngLat,
  Paginated,
  Squad,
  SquadJoinRequest,
  SquadProgress,
  SquadRole,
  SquadType,
  SquadPaymentStatus,
  SquadPaymentOrder,
} from '@/types';

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
  visibility?: 'public' | 'private' | 'invite';
  college?: string;
  /** Purpose category. Drives the auto-generated name and the card badge. */
  type?: SquadType;
  /** Where the squad is going. Set before the name in the create flow. */
  destination?: { lat: number; lng: number; label?: string; address?: string | null };
  /** Where it regroups first. Optional — a squad can be created without one. */
  meetingPoint?: { lat: number; lng: number; label?: string };
  meetingAt?: string;
  /** Hard cap including the leader. Server clamps to 2–200. */
  memberLimit?: number;
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

  /**
   * Asks to join. Admission is the leader's call, so a success here usually
   * means "request queued", not "you're in" — read `viewerStatus`.
   */
  join: (id: string) => api.post<Squad & { viewerStatus: 'pending' | 'active' }>(`/squads/${id}/join`),

  leave: (id: string) => api.post<void>(`/squads/${id}/leave`),

  /**
   * Ends a squad. Leader-only and terminal — this is the only way out of the
   * one-squad-at-a-time rule.
   */
  setStatus: (id: string, status: 'completed' | 'cancelled') =>
    api.patch<{ id: string; status: string }>(`/squads/${id}/status`, { status }),

  /** Whether the join fee is owed, already paid, or unavailable. */
  paymentStatus: (id: string) => api.get<SquadPaymentStatus>(`/squads/${id}/payment`),

  /** Creates a Razorpay order. The amount is decided server-side. */
  createPaymentOrder: (id: string) =>
    api.post<SquadPaymentOrder>(`/squads/${id}/payment/order`),

  /** Hands Razorpay's response back for server-side signature verification. */
  verifyPayment: (
    id: string,
    input: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    },
  ) => api.post<{ paid: boolean; amountPaise: number }>(`/squads/${id}/payment/verify`, input),

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
