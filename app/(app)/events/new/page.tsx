'use client';

import { toLocalInput } from '@/lib/utils';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Segmented } from '@/components/ui/tabs';
import { PlacePicker, type PickedPlace } from '@/components/shared/place-picker';
import { eventsService, type CreateEventInput } from '@/lib/services/events';
import { useGeolocation } from '@/lib/hooks/use-geolocation';

export default function NewEventPage() {
  const router = useRouter();
  const { center } = useGeolocation();

  const create = useMutation({
    mutationFn: (input: CreateEventInput) => eventsService.create(input),
    onSuccess: (event) => router.replace(`/events/${event.id}`),
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState<PickedPlace | null>(null);
  const [startsAt, setStartsAt] = useState('');
  const [ticketType, setTicketType] = useState<'free' | 'paid'>('free');
  const [price, setPrice] = useState('');
  const [capacity, setCapacity] = useState('');

  const ready = title.trim().length >= 3 && venue && startsAt;

  const submit = () => {
    if (!venue || !startsAt) return;
    create.mutate({
      title: title.trim(),
      venue: {
        lat: venue.lat,
        lng: venue.lng,
        label: venue.label,
        ...(venue.address ? { address: venue.address } : {}),
      },
      startsAt: new Date(startsAt).toISOString(),
      ticketType,
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(ticketType === 'paid' && price.trim() ? { price: Number(price) } : {}),
      ...(capacity.trim() ? { capacity: Number(capacity) } : {}),
    });
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/events"
          aria-label="Back to events"
          className="rounded-md p-2 text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-[22px] font-semibold tracking-[-0.025em] text-ink">
          Host an event
        </h1>
      </div>

      <div className="space-y-4">
        <Field label="Title">
          <Input
            placeholder="Open mic at the quad"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>

        <Field label="Description" hint="Optional">
          <Input
            placeholder="What should people expect?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        <Field label="Venue">
          <PlacePicker
            label="Venue"
            value={venue}
            onChange={setVenue}
            placeholder="Where is it happening?"
            proximity={center}
          />
        </Field>

        <Field label="Starts at">
          <DateTimePicker
            value={startsAt ? new Date(startsAt) : null}
            onChange={(next) => setStartsAt(toLocalInput(next))}
          />
        </Field>

        <div>
          <span className="mb-2 block text-[13px] font-medium text-ink">Entry</span>
          <Segmented
            value={ticketType}
            onChange={setTicketType}
            items={[
              { value: 'free', label: 'Free' },
              { value: 'paid', label: 'Paid' },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {ticketType === 'paid' ? (
            <Field label="Price">
              <Input
                type="number"
                min={0}
                placeholder="₹"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </Field>
          ) : null}
          <Field label="Capacity" hint="Optional">
            <Input
              type="number"
              min={1}
              placeholder="Unlimited"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </Field>
        </div>
      </div>

      <Button
        size="lg"
        className="w-full"
        disabled={!ready}
        loading={create.isPending}
        onClick={submit}
      >
        Publish event
      </Button>

      {create.isError ? (
        <p role="alert" className="text-[13px] text-danger">
          {create.error instanceof Error
            ? create.error.message
            : "Couldn't publish the event."}
        </p>
      ) : null}
    </div>
  );
}
