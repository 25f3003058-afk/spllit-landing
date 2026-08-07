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
            refetchOnWindowFocus: false,
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
