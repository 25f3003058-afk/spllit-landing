import { api } from '@/lib/api/client';
import type { HostAccount, Vehicle, VehicleBrandOption } from '@/types';

export const hostService = {
  /**
   * The caller's host side, or null if they have never opened host mode.
   * Distinct from a 404 — "not a host yet" is a normal state, not an error.
   */
  me: () => api.get<HostAccount | null>('/host/me'),

  /** Brands and models, served by the API so the two sides cannot drift. */
  catalogue: () =>
    api.get<{ brands: VehicleBrandOption[] }>('/host/catalogue').then((r) => r.brands),

  /**
   * Creates or updates the host profile.
   *
   * `idToken` comes from a Firebase *phone* sign-in — the server reads the
   * number out of the verified token rather than trusting a typed one. Omit it
   * only when editing the bio of an already-verified host.
   */
  save: (input: { idToken?: string; about?: string }) =>
    api.post<HostAccount>('/host/me', input),

  addVehicle: (input: {
    brandId: string;
    modelId: string;
    plate: string;
    colour?: string;
    seats?: number;
  }) => api.post<Vehicle>('/host/vehicles', input),

  makePrimary: (vehicleId: string) =>
    api.post<HostAccount>(`/host/vehicles/${vehicleId}/primary`),

  removeVehicle: (vehicleId: string) =>
    api.delete<HostAccount>(`/host/vehicles/${vehicleId}`),
};
