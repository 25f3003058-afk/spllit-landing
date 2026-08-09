import { Suspense } from 'react';

import { ErrorBoundary } from '@/components/shared/error-boundary';
import { Skeleton } from '@/components/ui/skeleton';
import { TripResults } from '@/components/trips/trip-results';

/**
 * Results for a destination search.
 *
 * The search itself lives in the query string, so this page is refreshable,
 * shareable and reachable with Back — none of which was true when the results
 * were a section of the home screen driven by local state.
 *
 * `useSearchParams` requires a Suspense boundary during prerender, and the
 * fallback matches the loaded layout so the page does not jump when it
 * resolves.
 */
export default function TripsPage() {
  return (
    <ErrorBoundary label="trip results">
      <Suspense
        fallback={
          <div className="mx-auto w-full max-w-2xl space-y-2 px-1 py-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-[92px] w-full rounded-2xl" />
            <Skeleton className="h-[92px] w-full rounded-2xl" />
          </div>
        }
      >
        <TripResults />
      </Suspense>
    </ErrorBoundary>
  );
}
