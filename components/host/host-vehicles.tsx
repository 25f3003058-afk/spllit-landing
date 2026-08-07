'use client';

import { useQuery } from '@tanstack/react-query';

import { hostService } from '@/lib/services/host';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ButtonLink } from '@/components/ui/button';
import { VehicleForm } from '@/components/host/vehicle-form';
import { VehicleList } from '@/components/host/vehicle-list';

export function HostVehicles() {
  const { data: host, isPending } = useQuery({
    queryKey: ['host', 'me'],
    queryFn: () => hostService.me(),
  });

  if (isPending) {
    return (
      <div className="mx-auto max-w-lg space-y-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    );
  }

  if (!host) {
    return (
      <div className="mx-auto max-w-lg">
        <EmptyState
          title="Host mode is not set up"
          description="Verify a phone number first — vehicles are registered against it."
          action={
            <ButtonLink href="/host/setup" size="sm">Set up</ButtonLink>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-display text-[20px] font-semibold tracking-[-0.02em] text-ink">
          Your vehicles
        </h1>
        <p className="mt-1 text-[13.5px] text-ink-muted">
          Riders see the make, model and registration before they join a trip.
        </p>
      </div>

      <VehicleList vehicles={host.vehicles} />

      <div className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-4 text-[14px] font-semibold text-ink">Add another</h2>
        <VehicleForm />
      </div>
    </div>
  );
}
