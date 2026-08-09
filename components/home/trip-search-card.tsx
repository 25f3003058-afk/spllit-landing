'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Circle, Clock, Search, Square } from 'lucide-react';

import { cn } from '@/lib/utils';
import { config } from '@/lib/config';
import { useGeolocation } from '@/lib/hooks/use-geolocation';
import { PlacePicker, type PickedPlace } from '@/components/shared/place-picker';
import { CalendarWithTimePresets } from '@/components/ui/calendar-with-time-presets';
import type { LngLat } from '@/types';
import { tripSearchParams } from '@/lib/trip-search';

/**
 * The whole of Home: where from, where to, when, go.
 *
 * This replaces a 1,353-line planner that put the search form, both result
 * lists, the purpose/vehicle filters and a live map on one screen. On a phone
 * that meant the answer to "where are you going" was below three folds of
 * controls for questions the user had not been asked yet.
 *
 * Everything that used to sit under this now lives on /trips, reached by the
 * button. The search itself travels in the URL, so the results screen can be
 * refreshed, shared and returned to.
 */
export function TripSearchCard() {
  const router = useRouter();
  const { center } = useGeolocation();

  const [pickup, setPickup] = useState<PickedPlace | null>(null);
  const [destination, setDestination] = useState<PickedPlace | null>(null);
  const [departNow, setDepartNow] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [departAt, setDepartAt] = useState(() => new Date(Date.now() + 30 * 60_000));

  /**
   * Origin falls back twice: the typed pickup, then the device, then the
   * configured city. The last step matters — the corridor search requires an
   * origin and returns 400 without one, so a denied location prompt would
   * otherwise make the button do nothing with no explanation.
   */
  const originPoint: LngLat =
    pickup
      ? [pickup.lng, pickup.lat]
      : center ?? [config.defaultLocation.lng, config.defaultLocation.lat];

  const originLabel =
    pickup?.label ?? (center ? 'Current location' : config.defaultLocation.label);

  const canSearch = Boolean(destination);

  const submit = () => {
    if (!destination) return;
    const params = tripSearchParams({
      origin: originPoint,
      originLabel,
      destination: [destination.lng, destination.lat],
      destinationLabel: destination.label,
      departAt: departNow ? null : departAt.toISOString(),
      tab: 'rides',
    });
    router.push(`/trips?${params.toString()}`);
  };

  return (
    <section className="mx-auto w-full max-w-lg">
      <div className="rounded-2xl border border-line bg-surface shadow-soft">
        <div className="border-b border-line px-4 py-4 sm:px-5">
          <h1 className="font-display text-[19px] font-semibold tracking-[-0.02em] text-ink sm:text-[22px]">
            Where are you going?
          </h1>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">
            Find people already heading the same way.
          </p>
        </div>

        <div className="space-y-2.5 px-4 py-4 sm:px-5">
          {/* The two points, with the connector that makes them read as one
              journey rather than two unrelated fields. */}
          <div className="flex items-start gap-2.5">
            <div className="flex flex-col items-center pt-3.5">
              <Circle className="h-2.5 w-2.5 fill-ink text-ink" />
              <span className="my-1 h-6 w-px bg-line-strong" />
              <Square className="h-2.5 w-2.5 fill-ink text-ink" />
            </div>

            <div className="min-w-0 flex-1 space-y-2.5">
              <PlacePicker
                label="Pickup"
                value={pickup}
                onChange={setPickup}
                placeholder={originLabel}
                proximity={originPoint}
              />
              <PlacePicker
                label="Destination"
                value={destination}
                onChange={setDestination}
                placeholder="Where to?"
                proximity={originPoint}
              />
            </div>
          </div>

          <div className="rounded-lg border border-line bg-surface px-3.5 py-2.5">
            <div className="flex w-full items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (departNow) {
                    setDepartNow(false);
                    setCalendarOpen(true);
                  } else {
                    setCalendarOpen((open) => !open);
                  }
                }}
                aria-expanded={calendarOpen}
                className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
              >
                <Clock className="h-4 w-4 shrink-0 text-ink-subtle" />
                <span className="flex-1 truncate text-sm text-ink">
                  {departNow
                    ? 'Leave now'
                    : departAt.toLocaleString(undefined, {
                        weekday: 'short',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDepartNow((now) => !now);
                  setCalendarOpen(departNow);
                }}
                className="shrink-0 text-[12.5px] font-medium text-brand"
              >
                {departNow ? 'Schedule' : 'Now'}
              </button>
            </div>

            {!departNow && calendarOpen ? (
              <CalendarWithTimePresets
                value={departAt}
                onChange={setDepartAt}
                onDone={() => setCalendarOpen(false)}
                className="mt-2.5"
              />
            ) : null}
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={!canSearch}
            className={cn(
              // h-12 is a comfortable thumb target at every width, and the
              // button is in normal flow — not absolutely positioned — so it
              // cannot end up over the keyboard or off-screen.
              'flex h-12 w-full items-center justify-center gap-2 rounded-xl',
              'bg-ink text-[15px] font-medium text-canvas',
              'transition-all duration-snap hover:opacity-90 active:scale-[0.99]',
              'disabled:pointer-events-none disabled:opacity-40',
            )}
          >
            <Search className="h-4 w-4" />
            Find trips
          </button>

          {!canSearch ? (
            <p className="text-center text-[12px] text-ink-subtle">
              Add a destination to search.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
