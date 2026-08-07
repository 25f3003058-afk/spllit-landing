'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/input';
import { Segmented } from '@/components/ui/tabs';
import { PlacePicker, type PickedPlace } from '@/components/shared/place-picker';
import { useCreateRide } from '@/lib/hooks/queries';
import { useGeolocation } from '@/lib/hooks/use-geolocation';
import type { VehicleType } from '@/types';

export default function NewRidePage() {
  const router = useRouter();
  const { center } = useGeolocation();
  const create = useCreateRide();

  const [origin, setOrigin] = useState<PickedPlace | null>(null);
  const [destination, setDestination] = useState<PickedPlace | null>(null);
  const [departure, setDeparture] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('cab');
  const [seats, setSeats] = useState('3');
  const [fare, setFare] = useState('');
  /**
   * Floor for the departure picker, captured once at mount.
   *
   * Read lazily rather than during render: `Date.now()` is impure, so calling
   * it inline makes the whole component unmemoisable under the React Compiler.
   * Mount time is precise enough for a "not in the past" bound — the server
   * re-checks against real now on submit.
   */
  const [earliest] = useState(() =>
    new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16),
  );

  /**
   * Why the button is disabled, in the user's words.
   *
   * A dead button with no explanation is what made this screen feel broken:
   * typing a place without picking one from the list leaves `origin` null, and
   * nothing on screen said so.
   */
  const blockers = [
    !origin ? 'pick a pickup point from the suggestions' : null,
    !destination ? 'pick a destination from the suggestions' : null,
    !departure ? 'choose a departure time' : null,
  ].filter((entry): entry is string => entry !== null);

  const ready = blockers.length === 0;

  const submit = () => {
    if (!origin || !destination || !departure) return;
    create.mutate(
      {
        origin: origin.label,
        originLat: origin.lat,
        originLng: origin.lng,
        destination: destination.label,
        destLat: destination.lat,
        destLng: destination.lng,
        departureTime: new Date(departure).toISOString(),
        vehicleType,
        seats: Number(seats) || 1,
        ...(fare.trim() ? { fare: Number(fare) } : {}),
      },
      { onSuccess: (ride) => router.replace(`/rides/${ride.id}`) },
    );
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/rides"
          aria-label="Back to rides"
          className="rounded-md p-2 text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-[22px] font-semibold tracking-[-0.025em] text-ink">
          Offer a ride
        </h1>
      </div>

      <div className="space-y-4">
        <Field label="Pickup">
          <PlacePicker
            label="Pickup"
            value={origin}
            onChange={setOrigin}
            placeholder="Where are you starting?"
            proximity={center}
          />
        </Field>

        <Field label="Destination">
          <PlacePicker
            label="Destination"
            value={destination}
            onChange={setDestination}
            placeholder="Where are you going?"
            proximity={center}
          />
        </Field>

        <Field label="Departure" htmlFor="ride-departure">
          <Input
            id="ride-departure"
            type="datetime-local"
            // Never in the past. The API rejects it anyway; catching it here
            // saves a round trip and a confusing error.
            min={earliest}
            value={departure}
            onChange={(e) => setDeparture(e.target.value)}
          />
        </Field>

        <div>
          <span className="mb-2 block text-[13px] font-medium text-ink">Vehicle</span>
          <Segmented
            value={vehicleType}
            onChange={setVehicleType}
            items={[
              { value: 'cab', label: 'Cab' },
              { value: 'auto', label: 'Auto' },
              { value: 'bike', label: 'Bike' },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Seats to share">
            <Input
              type="number"
              min={1}
              max={8}
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
            />
          </Field>
          <Field label="Share per person" hint="Optional">
            <Input
              type="number"
              min={0}
              placeholder="₹"
              value={fare}
              onChange={(e) => setFare(e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div>
        <Button
          size="lg"
          className="w-full"
          disabled={!ready}
          loading={create.isPending}
          onClick={submit}
        >
          Post ride
        </Button>

        {!ready ? (
          <p className="mt-2 text-center text-[12.5px] text-ink-subtle">
            To post, {blockers.join(', ')}.
          </p>
        ) : null}
      </div>

      {create.isError ? (
        <p role="alert" className="text-[13px] text-danger">
          {create.error instanceof Error ? create.error.message : "Couldn't post the ride."}
        </p>
      ) : null}
    </div>
  );
}
