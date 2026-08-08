'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ApiError } from '@/lib/api/client';

/**
 * Cache policy by data volatility (Section 7.4):
 *   profile / static reference  → minutes
 *   lists (rides, squads)       → seconds
 *   live position / presence    → never cached here, they arrive over sockets
 */
export const STALE = {
  /** Profile, community metadata — changes rarely. */
  long: 5 * 60_000,
  /** Feed lists, event lists. */
  medium: 60_000,
  /** Ride lists, nearby queries — move quickly. */
  short: 15_000,
  /** Anything the user expects to be current on every view. */
  none: 0,
} as const;

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: STALE.medium,
            gcTime: 10 * 60_000,
            /**
             * On, which is also TanStack's own default.
             *
             * Turning it off meant coming back to the tab showed whatever was
             * cached when you left — a cancelled ride still listed, a squad
             * that had filled up, a message count from ten minutes ago. On a
             * phone that is most of the app's life: the browser is backgrounded
             * constantly, and every return looked stale until a manual reload.
             *
             * It is not a request storm, because `staleTime` still gates it —
             * only queries already past their window refetch, and the volatile
             * ones are the short-lived lists where being current is the point.
             */
            refetchOnWindowFocus: true,
            /** Same reasoning for a dropped connection coming back. */
            refetchOnReconnect: true,
            retry: (failureCount, error) => {
              // Never retry auth failures or 404s — retrying cannot fix them.
              if (error instanceof ApiError && (error.isAuthError || error.isNotFound)) {
                return false;
              }
              return failureCount < 2;
            },
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
