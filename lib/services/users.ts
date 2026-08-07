import { api } from '@/lib/api/client';
import type { InviteSummary, Leaderboard, LngLat, User, UserSummary } from '@/types';

export interface OnboardingInput {
  phone: string;
  username: string;
  college: string;
  /** Stable institute id from content/institutes.ts. */
  instituteId?: string | undefined;
  name?: string;
  profilePhoto?: string;
  gender?: string;
}

/** Why a handle was refused. Kept distinct so the form can say which it was. */
export type UsernameRejection = 'invalid' | 'reserved' | 'taken';

export interface UsernameCheck {
  available: boolean;
  reason: UsernameRejection | null;
  /** Free alternatives, best first. Empty when `available` is true. */
  suggestions: string[];
}

export const usersService = {
  /**
   * The platform profile endpoint. Deliberately not `/users/me` — that path
   * belongs to the legacy router and returns a different shape that mobile
   * clients depend on.
   */
  me: () => api.get<User>('/users/me/profile'),

  /** Legacy endpoint; wraps its payload as { user }. */
  byId: (id: string) =>
    api.get<{ user: User }>(`/users/${id}`).then((payload) => payload.user),

  /**
   * Exchanges the Firebase ID token for a backend profile. Called once after
   * sign-in; creates the record on first call, returns the existing one after.
   */
  bootstrap: (ref?: string | null) =>
    api.post<User>('/users/me/bootstrap', ref ? { ref } : {}),

  /** Who joined through the caller's invite link. Attribution only. */
  invites: () => api.get<InviteSummary>('/users/me/invites'),

  /** College standings, ranked on completed rides. */
  leaderboard: (limit = 10) =>
    api.get<Leaderboard>('/users/leaderboard', { query: { limit } }),

  completeOnboarding: (input: OnboardingInput) =>
    api.post<User>('/users/me/onboarding', input),

  update: (input: Partial<Pick<User, 'name' | 'bio' | 'college' | 'profilePhoto'>>) =>
    api.patch<User>('/users/me/profile', input),

  /**
   * Proves ownership of a campus address.
   *
   * Takes a Firebase ID token from signing in with that Google account, not an
   * email string — the server verifies the token and reads the address out of
   * it, so nothing the user types can influence the result.
   */
  verifyInstituteWithGoogle: (idToken: string) =>
    api.post<User>('/users/me/institute-email', { idToken }),

  /**
   * Availability plus, when the answer is no, free alternatives — in one
   * round trip. `name` is optional and only shapes the suggestions.
   */
  checkUsername: (username: string, name?: string) =>
    api.get<UsernameCheck>('/users/username-available', {
      query: { username, name },
    }),

  /** Friends currently near a point — powers the Home feed and map layer. */
  nearby: (center: LngLat, radiusKm = 5) =>
    api.get<UserSummary[]>('/users/nearby', {
      query: { lng: center[0], lat: center[1], radiusKm },
    }),

  registerPushToken: (token: string) =>
    api.post<void>('/users/me/push-token', { token }),
};
