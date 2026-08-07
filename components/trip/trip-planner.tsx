'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Bike, Car, Circle, Clock, Search, Square, User, Users } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useGeolocation } from '@/lib/hooks/use-geolocation';
import { ridesService } from '@/lib/services/rides';
import { MapCanvas } from '@/components/map/map-canvas';
import { PlacePicker, reverseGeocode, type PickedPlace } from '@/components/shared/place-picker';
import { CalendarWithTimePresets } from '@/components/ui/calendar-with-time-presets';
import { PublishTripToggle } from '@/components/trip/publish-trip-toggle';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import type { LayerKey } from '@/lib/map/config';
import type { MapEntity, RouteGeometry } from '@/lib/map/types';
import type {
  CompanionKind,
  LngLat,
  Ride,
  RideSearchHit,
  TripCompanion,
  VehicleType,
} from '@/types';

/**
 * The trip planner — the app's dashboard.
 *
 * One layout serves both modes. "For me" and "Squad" differ only in what the
 * middle column asks and what the map is showing; the trip form on the left
 * and the map on the right are the same components with the same state, so
 * switching modes never loses a half-entered trip.
 */

type Mode = 'me' | 'squad';

const RIDE_OPTIONS: {
  type: VehicleType;
  label: string;
  note: string;
  seats: number;
  Icon: typeof Car;
}[] = [
  { type: 'cab', label: 'Cab', note: 'Sedan or similar', seats: 4, Icon: Car },
  { type: 'auto', label: 'Auto', note: 'Three-wheeler', seats: 3, Icon: Car },
  { type: 'bike', label: 'Bike', note: 'Pillion seat', seats: 1, Icon: Bike },
];

/**
 * Pin colours. These are the legend — each one means a different next action,
 * so they must stay distinguishable from each other and from the route line.
 */
const COMPANION_ACCENT: Record<CompanionKind, string> = {
  /** Has already created a ride there — you can join it. */
  host: 'var(--brand)',
  /** Already riding along on someone's ride. */
  passenger: 'var(--accent)',
  /** Online near you, same campus, no ride yet — invite them. */
  online: '#f5a524',
};

const COMPANION_LABEL: Record<CompanionKind, string> = {
  host: 'Created a ride',
  passenger: 'Going along',
  online: 'Online nearby',
};

const DESTINATION_ACCENT = '#121212';
const MEETING_ACCENT = '#8b5cf6';
/** A matched host — the answer to the search, so it outranks browse pins. */
const MATCH_ACCENT = 'var(--brand)';

const PLANNER_LAYERS: LayerKey[] = ['rides', 'squads', 'friends'];

/**
 * Stable empties. `data?.items ?? []` allocates a fresh array on every render
 * while a query is pending, which defeats memoisation of everything derived
 * from it — including the map's entity list.
 */
const NO_COMPANIONS: TripCompanion[] = [];
const NO_MATCHES: RideSearchHit[] = [];
const NO_RIDES: Ride[] = [];

function formatWhen(iso: string | null): string {
  if (!iso) return 'Time not set';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Time not set';
  return date.toLocaleString(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** "walk 300 m" reads better than "0.3 km"; past a kilometre the reverse. */
function formatWalk(metres: number): string {
  return metres < 950 ? `${Math.round(metres / 10) * 10} m` : `${(metres / 1000).toFixed(1)} km`;
}

function formatDistance(metres: number | null): string | null {
  if (metres === null) return null;
  return metres < 1000 ? `${metres} m away` : `${(metres / 1000).toFixed(1)} km away`;
}

export function TripPlanner() {
  const router = useRouter();
  const { center } = useGeolocation();

  const [mode, setMode] = useState<Mode>('me');
  const [pickup, setPickup] = useState<PickedPlace | null>(null);
  const [destination, setDestination] = useState<PickedPlace | null>(null);
  const [departNow, setDepartNow] = useState(true);
  const [departAt, setDepartAt] = useState(() => new Date(Date.now() + 30 * 60_000));
  const [vehicle, setVehicle] = useState<VehicleType | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /**
   * The corridor search is explicit, not reactive. It costs real Directions
   * requests per candidate, so it runs when the user asks for it — and the
   * trip they asked about is frozen here so editing the form afterwards does
   * not silently invalidate the results they are reading.
   */
  const [searchedTrip, setSearchedTrip] = useState<{
    origin: LngLat;
    destination: LngLat;
    departAt: string;
  } | null>(null);

  const [meetingPoint, setMeetingPoint] = useState<PickedPlace | null>(null);
  /**
   * Bumped only when a pin is dropped, and used to remount the meeting-point
   * field so it shows the new label. Keying on the point itself would remount
   * mid-typing, because typing clears the value on its way to a new one.
   */
  const [pinNonce, setPinNonce] = useState(0);
  const [pinPending, setPinPending] = useState(false);

  // The pickup the user typed wins; otherwise wherever they actually are.
  const originPoint: LngLat | null = pickup ? [pickup.lng, pickup.lat] : center;
  const destinationPoint: LngLat | null = destination
    ? [destination.lng, destination.lat]
    : null;
  const departIso = departNow ? new Date().toISOString() : departAt.toISOString();

  // --- data ---------------------------------------------------------------

  const ridesQuery = useQuery({
    queryKey: ['planner-rides', originPoint, destination?.label, vehicle],
    queryFn: () =>
      ridesService.list({
        near: originPoint ?? undefined,
        radiusKm: 20,
        ...(vehicle ? { vehicleType: vehicle } : {}),
        limit: 20,
      }),
    enabled: mode === 'me' && Boolean(originPoint),
  });

  const searchQuery = useQuery({
    queryKey: ['ride-search', searchedTrip],
    queryFn: () =>
      ridesService.search({
        origin: searchedTrip!.origin,
        destination: searchedTrip!.destination,
        departAt: searchedTrip!.departAt,
        windowMins: 120,
      }),
    enabled: Boolean(searchedTrip),
  });

  const companionsQuery = useQuery({
    queryKey: ['planner-companions', destinationPoint, departIso, originPoint],
    queryFn: () =>
      ridesService.companions({
        destination: destinationPoint as LngLat,
        destRadiusKm: 5,
        departAt: departIso,
        windowMins: 90,
        near: originPoint,
      }),
    // Without a destination there is nothing to match on — the whole search is
    // "who else is going *there*".
    enabled: mode === 'squad' && Boolean(destinationPoint),
  });

  const matches = searchQuery.data?.items ?? NO_MATCHES;
  const companions = companionsQuery.data?.items ?? NO_COMPANIONS;
  const rides = ridesQuery.data?.items ?? NO_RIDES;

  // --- map ----------------------------------------------------------------

  // Not wrapped in useMemo: the React Compiler is enabled for this project and
  // memoises this automatically from the values it reads, which it can only do
  // if we do not hand-roll a memo it has to preserve.
  const entities: MapEntity[] = (() => {
    const list: MapEntity[] = [];

    if (destinationPoint && destination) {
      list.push({
        id: 'trip-destination',
        layer: 'rides',
        position: destinationPoint,
        title: destination.label,
        subtitle: 'Destination',
        accent: DESTINATION_ACCENT,
      });
    }

    if (meetingPoint) {
      list.push({
        id: 'trip-meeting-point',
        layer: 'squads',
        position: [meetingPoint.lng, meetingPoint.lat],
        title: meetingPoint.label,
        subtitle: 'Meeting point',
        accent: MEETING_ACCENT,
      });
    }

    for (const hit of matches) {
      if (hit.ride.originLat === null || hit.ride.originLng === null) continue;
      list.push({
        id: `match-${hit.ride.id}`,
        layer: 'rides',
        position: [hit.ride.originLng, hit.ride.originLat],
        title: hit.ride.host?.name ?? hit.ride.origin,
        subtitle: `${formatWalk(hit.pickupWalkMetres)} walk`,
        accent: MATCH_ACCENT,
        href: `/rides/${hit.ride.id}`,
      });
    }

    if (mode === 'squad') {
      for (const companion of companions) {
        list.push({
          id: `companion-${companion.user.id}`,
          layer: 'friends',
          position: [companion.lng, companion.lat],
          title: companion.user.name,
          subtitle: COMPANION_LABEL[companion.kind],
          accent: COMPANION_ACCENT[companion.kind],
          live: companion.live,
          imageUrl: companion.user.profilePhoto,
          ...(companion.rideId ? { href: `/rides/${companion.rideId}` } : {}),
        });
      }
    } else {
      for (const ride of rides) {
        if (ride.originLat === null || ride.originLng === null) continue;
        list.push({
          id: `ride-${ride.id}`,
          layer: 'rides',
          position: [ride.originLng, ride.originLat],
          title: ride.destination,
          subtitle: formatWhen(ride.departureTime),
          href: `/rides/${ride.id}`,
        });
      }
    }

    return list;
  })();

  /**
   * The host's road route, drawn only for the match the user is looking at.
   * Painting every candidate's route at once turns the map into spaghetti and
   * hides the one thing the selection is meant to answer.
   */
  const selectedMatch = matches.find((hit) => selectedId === `match-${hit.ride.id}`) ?? null;
  const selectedRoute: RouteGeometry | null = selectedMatch?.route
    ? { coordinates: selectedMatch.route }
    : null;

  const canSearchSquad = Boolean(destinationPoint);
  const meetingSuggestion = companionsQuery.data?.meetingSuggestion ?? null;

  /** Shared by the pin-drop handler and the "use the midpoint" shortcut. */
  const adoptMeetingPoint = (point: LngLat) => {
    setPinPending(true);
    void reverseGeocode(point)
      .then((place) => {
        setMeetingPoint(place);
        setPinNonce((nonce) => nonce + 1);
      })
      .finally(() => setPinPending(false));
  };

  /**
   * Only armed in squad mode. Handing the map a click handler in "For me" mode
   * would turn every dismissing tap into an accidental meeting point.
   */
  const handleMapClick = mode === 'squad' ? adoptMeetingPoint : undefined;

  // --- render -------------------------------------------------------------

  return (
    /**
     * Sunken page, raised panels. Every pane used to be `bg-surface` on a
     * `bg-canvas` page — two near-whites a couple of percent apart, so nothing
     * had an edge and the whole screen read as one flat sheet. Recessing the
     * page and floating real cards on it is what gives the layout depth.
     */
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col gap-3 bg-surface-sunken p-3 sm:gap-4 sm:p-4 xl:h-[calc(100dvh-4rem)] xl:flex-row">
      {/* Left: the trip itself. Identical in both modes by design — switching
          to Squad must never make someone re-enter where they are going. */}
      <aside className="shrink-0 rounded-2xl border border-line bg-surface shadow-soft xl:flex xl:w-[356px] xl:flex-col">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-display text-[16px] font-semibold tracking-[-0.015em] text-ink">
            Find a trip
          </h2>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">
            Where you&apos;re going, and who with.
          </p>
        </div>

        <div className="px-5 py-5 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
        <div className="space-y-2.5">
          <div className="flex items-start gap-2.5">
            <Circle className="mt-3.5 h-3 w-3 shrink-0 fill-ink text-ink" />
            <div className="min-w-0 flex-1">
              <PlacePicker
                label="Pickup point"
                value={pickup}
                onChange={setPickup}
                placeholder={center ? 'Current location' : 'Pickup point'}
                proximity={center}
              />
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Square className="mt-3.5 h-3 w-3 shrink-0 fill-ink text-ink" />
            <div className="min-w-0 flex-1">
              <PlacePicker
                label="Destination"
                value={destination}
                onChange={setDestination}
                placeholder="Where to?"
                proximity={center}
              />
            </div>
          </div>

          <div className="rounded-lg border border-line bg-surface px-3.5 py-2.5">
            <button
              type="button"
              onClick={() => setDepartNow((now) => !now)}
              className="flex w-full items-center gap-2.5 text-left"
            >
              <Clock className="h-4 w-4 shrink-0 text-ink-subtle" />
              <span className="flex-1 truncate text-sm text-ink">
                {departNow ? 'Pick up now' : formatWhen(departAt.toISOString())}
              </span>
              <span className="shrink-0 text-[12px] font-medium text-brand">
                {departNow ? 'Schedule' : 'Now'}
              </span>
            </button>
            {!departNow ? (
              <CalendarWithTimePresets
                value={departAt}
                onChange={setDepartAt}
                className="mt-2.5"
              />
            ) : null}
          </div>

          {/* Mode switch. Both options render the same three-column shell —
              only the middle column and the map layers change. */}
          <div
            role="tablist"
            aria-label="Who is this trip for"
            className="flex gap-1 rounded-lg border border-line bg-surface p-1"
          >
            {(
              [
                { key: 'me', label: 'For me', Icon: User },
                { key: 'squad', label: 'Squad', Icon: Users },
              ] as const
            ).map((option) => (
              <button
                key={option.key}
                role="tab"
                aria-selected={mode === option.key}
                onClick={() => {
                  setMode(option.key);
                  setSelectedId(null);
                }}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-[13px] font-medium',
                  'transition-colors duration-snap',
                  mode === option.key
                    ? 'bg-ink text-canvas'
                    : 'text-ink-muted hover:text-ink',
                )}
              >
                <option.Icon className="h-3.5 w-3.5" />
                {option.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={!originPoint || !destinationPoint || searchQuery.isFetching}
            onClick={() =>
              originPoint &&
              destinationPoint &&
              setSearchedTrip({
                origin: originPoint,
                destination: destinationPoint,
                departAt: departIso,
              })
            }
            className={cn(
              'flex h-12 w-full items-center justify-center gap-2 rounded-xl',
              'bg-ink text-[15px] font-medium text-canvas transition-all duration-snap',
              'hover:opacity-90 active:scale-[0.99]',
              'disabled:pointer-events-none disabled:opacity-40',
            )}
          >
            <Search className="h-4 w-4" />
            {searchQuery.isFetching ? 'Searching…' : 'Find a ride'}
          </button>

          {!destinationPoint ? (
            <p className="text-center text-[12px] text-ink-subtle">
              Add a destination to search.
            </p>
          ) : (
            <PublishTripToggle
              pickup={pickup}
              destination={destination}
              originPoint={originPoint}
              departAt={departIso}
            />
          )}
        </div>

        {mode === 'squad' ? (
          <div className="mt-5">
            <h3 className="text-[13px] font-semibold text-ink">Meeting point</h3>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
              Search for a spot, or click anywhere on the map to drop a pin.
            </p>
            <div className="mt-2.5">
              <PlacePicker
                label="Meeting point"
                key={`meeting-${pinNonce}`}
                value={meetingPoint}
                onChange={setMeetingPoint}
                placeholder={pinPending ? 'Reading the pin…' : 'Somewhere in the middle'}
                proximity={originPoint}
              />
            </div>
            {meetingSuggestion && !meetingPoint ? (
              <button
                type="button"
                onClick={() =>
                  adoptMeetingPoint([meetingSuggestion.lng, meetingSuggestion.lat])
                }
                className="mt-2 text-[12px] font-medium text-brand hover:underline"
              >
                Use the midpoint of everyone&apos;s pickups
              </button>
            ) : null}

            <dl className="mt-5 space-y-2">
              {(Object.keys(COMPANION_ACCENT) as CompanionKind[]).map((kind) => (
                <div key={kind} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: COMPANION_ACCENT[kind] }}
                  />
                  <dt className="text-[12px] text-ink-muted">{COMPANION_LABEL[kind]}</dt>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: MEETING_ACCENT }}
                />
                <dt className="text-[12px] text-ink-muted">Meeting point</dt>
              </div>
            </dl>
          </div>
        ) : null}
        </div>
      </aside>

      {/* Centre: what you can actually pick. */}
      <section className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-line bg-surface px-5 py-6 shadow-soft sm:px-7 sm:py-7 xl:overflow-y-auto">
        {mode === 'me' ? (
          <>
            <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-ink sm:text-[32px]">
              {searchedTrip ? 'Rides going your way' : 'Choose a ride'}
            </h1>

            {searchedTrip ? (
              <div className="mt-6">
                {searchQuery.isFetching ? (
                  <div className="space-y-2">
                    <Skeleton className="h-[86px] w-full rounded-2xl" />
                    <Skeleton className="h-[86px] w-full rounded-2xl" />
                  </div>
                ) : searchQuery.isError ? (
                  <EmptyState
                    tone="error"
                    title="Search failed"
                    description={
                      searchQuery.error instanceof Error
                        ? searchQuery.error.message
                        : 'Something went wrong.'
                    }
                    action={
                      <Button size="sm" onClick={() => void searchQuery.refetch()}>
                        Retry
                      </Button>
                    }
                  />
                ) : matches.length === 0 ? (
                  <EmptyState
                    title="Nobody driving past yet"
                    description={`No host's route passes within ${formatWalk(
                      searchQuery.data?.corridorMetres ?? 1500,
                    )} of both your pickup and your drop-off in this window. Post the trip and let a host find you.`}
                    action={
                      <Button size="sm" onClick={() => router.push('/rides/new')}>
                        Post it
                      </Button>
                    }
                  />
                ) : (
                  <ul className="space-y-2">
                    {matches.map((hit) => (
                      <MatchRow
                        key={hit.ride.id}
                        hit={hit}
                        selected={selectedId === `match-${hit.ride.id}`}
                        onHover={() => setSelectedId(`match-${hit.ride.id}`)}
                      />
                    ))}
                  </ul>
                )}

                <button
                  type="button"
                  onClick={() => setSearchedTrip(null)}
                  className="mt-5 text-[13px] font-medium text-ink-muted hover:text-ink"
                >
                  ← Back to browsing
                </button>
              </div>
            ) : (
            <>
            <ul className="mt-6 space-y-1">
              {RIDE_OPTIONS.map((option) => {
                const matching = rides.filter((ride) => ride.vehicleType === option.type).length;
                const active = vehicle === option.type;
                return (
                  <li key={option.type}>
                    <button
                      type="button"
                      onClick={() => setVehicle(active ? null : option.type)}
                      aria-pressed={active}
                      className={cn(
                        'flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left',
                        'transition-colors duration-snap',
                        active
                          ? 'border-ink bg-surface-sunken'
                          : 'border-transparent hover:bg-surface-sunken',
                      )}
                    >
                      <option.Icon className="h-8 w-8 shrink-0 text-ink" strokeWidth={1.25} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="font-display text-[19px] font-semibold text-ink">
                            {option.label}
                          </span>
                          <span className="flex items-center gap-0.5 text-[12px] text-ink-muted">
                            <User className="h-3 w-3" />
                            {option.seats}
                          </span>
                        </span>
                        <span className="block truncate text-[13px] text-ink-muted">
                          {option.note}
                        </span>
                      </span>
                      <span className="shrink-0 text-[13px] font-medium text-ink-muted">
                        {ridesQuery.isPending ? '—' : `${matching} nearby`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-7 border-t border-line pt-6">
              {ridesQuery.isPending && originPoint ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full rounded-2xl" />
                  <Skeleton className="h-16 w-full rounded-2xl" />
                </div>
              ) : rides.length === 0 ? (
                <EmptyState
                  title="No rides going yet"
                  description="Nobody has posted a ride near you for this window. Offer one and let people join you."
                  action={
                    <Button size="sm" onClick={() => router.push('/rides/new')}>
                      Offer a ride
                    </Button>
                  }
                />
              ) : (
                <ul className="space-y-2">
                  {rides.slice(0, 8).map((ride) => (
                    <li key={ride.id}>
                      <Link
                        href={`/rides/${ride.id}`}
                        onMouseEnter={() => setSelectedId(`ride-${ride.id}`)}
                        className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 transition-colors duration-snap hover:border-line-strong"
                      >
                        <Avatar
                          src={ride.host?.profilePhoto ?? null}
                          name={ride.host?.name ?? 'Host'}
                          size="sm"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-medium text-ink">
                            {ride.origin} → {ride.destination}
                          </span>
                          <span className="block truncate text-[12.5px] text-ink-muted">
                            {formatWhen(ride.departureTime)} ·{' '}
                            {Math.max(ride.seats - ride.seatsTaken, 0)} seats left
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            </>
            )}
          </>
        ) : (
          <>
            <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em] text-ink sm:text-[32px]">
              Going your way
            </h1>
            <p className="mt-2 text-[14px] text-ink-muted">
              {destination
                ? `Spllit users heading to ${destination.label} around ${formatWhen(departIso)}.`
                : 'Set a destination and we will find people heading there at the same time.'}
            </p>

            <div className="mt-6">
              {!canSearchSquad ? (
                <EmptyState
                  title="Where are you going?"
                  description="Pick a destination on the left. We match on where you are heading, not where you start — two people leaving from opposite ends of campus for the same airport are exactly the point."
                />
              ) : companionsQuery.isPending ? (
                <div className="space-y-2">
                  <Skeleton className="h-[76px] w-full rounded-2xl" />
                  <Skeleton className="h-[76px] w-full rounded-2xl" />
                  <Skeleton className="h-[76px] w-full rounded-2xl" />
                </div>
              ) : companionsQuery.isError ? (
                <EmptyState
                  title="Could not run the search"
                  description={
                    companionsQuery.error instanceof Error
                      ? companionsQuery.error.message
                      : 'Something went wrong.'
                  }
                  action={
                    <Button onClick={() => void companionsQuery.refetch()}>Try again</Button>
                  }
                />
              ) : companions.length === 0 ? (
                <EmptyState
                  title="Nobody yet"
                  description="No one is heading there in this window. Post the ride yourself and people going the same way will find it."
                  action={
                    <Button size="sm" onClick={() => router.push('/rides/new')}>
                      Offer a ride
                    </Button>
                  }
                />
              ) : (
                <ul className="space-y-2">
                  {companions.map((companion) => (
                    <CompanionRow
                      key={companion.user.id}
                      companion={companion}
                      selected={selectedId === `companion-${companion.user.id}`}
                      onHover={() => setSelectedId(`companion-${companion.user.id}`)}
                    />
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </section>

      {/* Right: the map. Same component in both modes; only the pins differ. */}
      <div className="relative h-[300px] shrink-0 overflow-hidden rounded-2xl border border-line shadow-soft sm:h-[380px] xl:h-auto xl:w-[40%]">
        <MapCanvas
          layers={PLANNER_LAYERS}
          entities={entities}
          center={destinationPoint ?? originPoint}
          selectedId={selectedId}
          onSelect={(entity) => setSelectedId(entity?.id ?? null)}
          route={selectedRoute}
          {...(handleMapClick ? { onMapClick: handleMapClick } : {})}
          showSelf={!pickup}
        />

        {/* Top-edge scrim. Mapbox's own place labels run right to the corner
            and collide with the card radius; a short fade gives the card a
            clean top without covering anything the user placed. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/15 to-transparent"
        />

        {mode === 'squad' ? (
          // Sits above the floating dock, which overlays the bottom of the map
          // at every size below xl where the map is full width.
          <p className="pointer-events-none absolute inset-x-3 bottom-24 rounded-full border border-white/25 bg-neutral-900/80 px-3 py-2 text-center text-[12px] font-medium text-white backdrop-blur-sm xl:bottom-4">
            Click the map to set a meeting point
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * One corridor match.
 *
 * The two walk distances are the headline, not the fare: they are the number
 * that decides whether this ride is usable, and they are exactly what a "rides
 * starting near me" list cannot tell you.
 */
function MatchRow({
  hit,
  selected,
  onHover,
}: {
  hit: RideSearchHit;
  selected: boolean;
  onHover: () => void;
}) {
  const full = hit.seatsLeft === 0;

  return (
    <li onMouseEnter={onHover}>
      <Link
        href={`/rides/${hit.ride.id}`}
        className={cn(
          'flex items-center gap-3 rounded-2xl border bg-surface px-4 py-3.5',
          'transition-colors duration-snap',
          selected ? 'border-brand' : 'border-line hover:border-line-strong',
          full && 'opacity-55',
        )}
      >
        <Avatar
          src={hit.ride.host?.profilePhoto ?? null}
          name={hit.ride.host?.name ?? 'Host'}
          size="md"
        />

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-[14px] font-medium text-ink">
              {hit.ride.host?.name ?? 'Host'}
            </span>
            {full ? (
              <span className="shrink-0 rounded-full bg-surface-sunken px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
                Full
              </span>
            ) : null}
          </span>
          <span className="block truncate text-[12.5px] text-ink-muted">
            {formatWhen(hit.ride.departureTime)} · {hit.seatsLeft} seats left
          </span>
          <span className="mt-0.5 block truncate text-[12px] text-ink-subtle">
            {formatWalk(hit.pickupWalkMetres)} to pickup ·{' '}
            {formatWalk(hit.dropoffWalkMetres)} from drop-off
            {/* Says so plainly when the match came from a straight line rather
                than real roads, because the walk figures are then optimistic. */}
            {hit.routed ? '' : ' · approx.'}
          </span>
        </span>
      </Link>
    </li>
  );
}

function CompanionRow({
  companion,
  selected,
  onHover,
}: {
  companion: TripCompanion;
  selected: boolean;
  onHover: () => void;
}) {
  const distance = formatDistance(companion.distanceMetres);
  const accent = COMPANION_ACCENT[companion.kind];

  const body = (
    <>
      <span className="relative shrink-0">
        <Avatar src={companion.user.profilePhoto} name={companion.user.name} size="md" />
        <span
          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-surface"
          style={{ backgroundColor: accent }}
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium text-ink">
          {companion.user.name}
        </span>
        <span className="block truncate text-[12.5px] text-ink-muted">
          {COMPANION_LABEL[companion.kind]}
          {companion.origin ? ` · from ${companion.origin}` : ''}
        </span>
        <span className="mt-0.5 block truncate text-[12px] text-ink-subtle">
          {[
            companion.departureTime ? formatWhen(companion.departureTime) : null,
            companion.seatsLeft !== null ? `${companion.seatsLeft} seats left` : null,
            distance,
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </span>
    </>
  );

  const className = cn(
    'flex w-full items-center gap-3 rounded-2xl border bg-surface px-4 py-3.5 text-left',
    'transition-colors duration-snap',
    selected ? 'border-line-strong' : 'border-line hover:border-line-strong',
  );

  return (
    <li onMouseEnter={onHover}>
      {companion.rideId ? (
        <Link href={`/rides/${companion.rideId}`} className={className}>
          {body}
        </Link>
      ) : (
        // No ride to open — this person is just online and going the same way.
        <Link href={`/profile/${companion.user.id}`} className={className}>
          {body}
        </Link>
      )}
    </li>
  );
}
