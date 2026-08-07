import { api } from '@/lib/api/client';
import type { HostStatus, Vehicle, VehicleStatus } from '@/types';

export interface AdminOverview {
  users: { total: number; new24h: number; new7d: number };
  rides: { active: number; today: number; completed: number };
  squads: { total: number; active: number };
  events: { upcoming: number };
  communities: { total: number };
  waitlist: { total: number };
  emergencies: { open: number };
  messages: { last24h: number };
  signupTrend: { date: string; count: number }[];
}

export interface AdminUser {
  id: string;
  name: string;
  username: string | null;
  email: string;
  phone: string | null;
  college: string;
  profilePhoto: string | null;
  role: 'user' | 'subadmin' | 'admin';
  isActive: boolean;
  onboarded: boolean;
  rating: number;
  totalRides: number;
  createdAt: string;
  lastSeen: string;
}

export type ContentType =
  | 'rides'
  | 'squads'
  | 'events'
  | 'communities'
  | 'waitlist'
  | 'emergencies';

/** Rows come back shaped per type; the table renders them generically. */
export type ContentRow = Record<string, unknown> & { id: string };

export const adminService = {
  overview: () => api.get<AdminOverview>('/admin-panel/overview'),

  users: (q: string, page = 1) =>
    api.get<{ items: AdminUser[]; total: number; page: number; perPage: number }>(
      '/admin-panel/users',
      { query: { q, page } },
    ),

  setUserActive: (id: string, isActive: boolean) =>
    api.patch<AdminUser>(`/admin-panel/users/${id}`, { isActive }),

  setUserRole: (id: string, role: AdminUser['role']) =>
    api.patch<AdminUser>(`/admin-panel/users/${id}/role`, { role }),

  content: (type: ContentType) =>
    api.get<ContentRow[]>('/admin-panel/content', { query: { type } }),

  removeContent: (type: ContentType, id: string) =>
    api.delete<void>(`/admin-panel/content/${type}/${id}`),

  setEmergencyStatus: (
    id: string,
    status: 'active' | 'acknowledged' | 'resolved' | 'false-alarm',
  ) => api.patch<ContentRow>(`/admin-panel/emergencies/${id}`, { status }),

  broadcast: (input: { title: string; body: string; college?: string; href?: string }) =>
    api.post<{ sent: number }>('/admin-panel/broadcast', input),

  /** Host vehicle verification queue. */
  vehicleQueue: (status: VehicleStatus = 'pending') =>
    api.get<AdminVehicle[]>('/admin-panel/vehicles', { query: { status } }),

  /**
   * Approve or reject one vehicle. Returns the host's recomputed status —
   * approving a first vehicle is what activates the host, and the caller needs
   * to know whether it did.
   */
  reviewVehicle: (id: string, decision: 'verified' | 'rejected', rejectionNote?: string) =>
    api.patch<{ id: string; status: VehicleStatus; hostStatus: HostStatus }>(
      `/admin-panel/vehicles/${id}`,
      { status: decision, ...(rejectionNote ? { rejectionNote } : {}) },
    ),
};

/** A queue row: the vehicle plus enough of the host to judge it. */
export interface AdminVehicle extends Vehicle {
  hostPhone: string | null;
  hostStatus: HostStatus | null;
  user: {
    id: string;
    name: string;
    username: string | null;
    email: string;
    college: string;
    profilePhoto: string | null;
  } | null;
}
