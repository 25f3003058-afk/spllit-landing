import { ErrorBoundary } from '@/components/shared/error-boundary';
import { TripSearchCard } from '@/components/home/trip-search-card';

/**
 * Home asks one question.
 *
 * It used to render the whole trip planner — search form, ride list, squad
 * list, vehicle and purpose filters, counts and a live map, all at once. On a
 * phone the primary action sat below several screens of controls for decisions
 * the user had not made yet, and the map made the page heavy before anything
 * was even searched.
 *
 * Everything that lived here still exists; it moved to /trips, which is reached
 * by answering the question. See lib/trip-search.ts for how the answer travels.
 */
export default function HomePage() {
  return (
    <div className="px-1 py-4 sm:py-6">
      <ErrorBoundary label="trip search">
        <TripSearchCard />
      </ErrorBoundary>
    </div>
  );
}
