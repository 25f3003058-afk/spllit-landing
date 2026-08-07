import { ErrorBoundary } from '@/components/shared/error-boundary';
import { TripPlanner } from '@/components/trip/trip-planner';

/**
 * The dashboard is the trip planner. Everything a signed-in user comes here to
 * do starts with "where are you going", so that question owns the screen
 * rather than sitting under a wall of feed sections — those live on their own
 * routes (/rides, /squads, /events) and in the activity rail.
 */
export default function HomePage() {
  return (
    <ErrorBoundary label="trip planner">
      <TripPlanner />
    </ErrorBoundary>
  );
}
