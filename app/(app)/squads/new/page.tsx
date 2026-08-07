'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/input';
import { Segmented } from '@/components/ui/tabs';
import { PlacePicker, type PickedPlace } from '@/components/shared/place-picker';
import { useCreateSquad } from '@/lib/hooks/queries';
import { useGeolocation } from '@/lib/hooks/use-geolocation';
import { useAuth } from '@/lib/auth/auth-provider';

export default function NewSquadPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { center } = useGeolocation();
  const create = useCreateSquad();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [meetingPoint, setMeetingPoint] = useState<PickedPlace | null>(null);
  const [meetingAt, setMeetingAt] = useState('');

  const submit = () => {
    if (name.trim().length < 2) return;
    create.mutate(
      {
        name: name.trim(),
        visibility,
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(profile?.college ? { college: profile.college } : {}),
        ...(meetingPoint
          ? {
              meetingPoint: {
                lat: meetingPoint.lat,
                lng: meetingPoint.lng,
                label: meetingPoint.label,
              },
            }
          : {}),
        ...(meetingAt ? { meetingAt: new Date(meetingAt).toISOString() } : {}),
      },
      { onSuccess: (squad) => router.replace(`/squads/${squad.id}`) },
    );
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/squads"
          aria-label="Back to squads"
          className="rounded-md p-2 text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-[22px] font-semibold tracking-[-0.025em] text-ink">
          Start a squad
        </h1>
      </div>

      <div className="space-y-4">
        <Field label="Squad name">
          <Input
            placeholder="Friday studio session"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <Field label="What's it for?" hint="Optional">
          <Input
            placeholder="Weekly jam, library group, airport run…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        <div>
          <span className="mb-2 block text-[13px] font-medium text-ink">Visibility</span>
          <Segmented
            value={visibility}
            onChange={setVisibility}
            items={[
              { value: 'public', label: 'Public' },
              { value: 'private', label: 'Invite only' },
            ]}
          />
          <p className="mt-2 text-[12px] text-ink-subtle">
            {visibility === 'public'
              ? 'Anyone nearby can find this squad on the map.'
              : 'Only people you invite can see it.'}
          </p>
        </div>

        <Field label="Meeting point" hint="You can set this later.">
          <PlacePicker
            label="Meeting point"
            value={meetingPoint}
            onChange={setMeetingPoint}
            placeholder="Where is everyone meeting?"
            proximity={center}
          />
        </Field>

        {meetingPoint ? (
          <Field label="Meeting time" hint="Optional">
            <Input
              type="datetime-local"
              value={meetingAt}
              onChange={(e) => setMeetingAt(e.target.value)}
            />
          </Field>
        ) : null}
      </div>

      <Button
        size="lg"
        className="w-full"
        disabled={name.trim().length < 2}
        loading={create.isPending}
        onClick={submit}
      >
        Create squad
      </Button>

      {create.isError ? (
        <p role="alert" className="text-[13px] text-danger">
          {create.error instanceof Error
            ? create.error.message
            : "Couldn't create the squad."}
        </p>
      ) : null}
    </div>
  );
}
