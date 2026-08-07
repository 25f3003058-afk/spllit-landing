import { ErrorBoundary } from '@/components/shared/error-boundary';
import { TripPlanner } from '@/components/trip/trip-planner';
import { WelcomePanel } from '@/components/home/welcome-panel';

/**
 * The dashboard is the trip planner. Everything a signed-in user comes here to
 * do starts with "where are you going", so that question owns the screen
 * rather than sitting under a wall of feed sections — those live on their own
 * routes (/rides, /squads, /events) and in the activity rail.
 *
 * The welcome panel sits above it and disappears for good once dismissed, so
 * it introduces the product without permanently displacing the thing people
 * came here to use.
 */
export default function HomePage() {
  return (
    <div className="space-y-5">
      <WelcomePanel />
      <ErrorBoundary label="trip planner">
        <TripPlanner />
      </ErrorBoundary>
    </div>
  );
}
