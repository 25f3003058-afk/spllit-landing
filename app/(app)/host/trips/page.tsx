import type { Metadata } from 'next';

import { HostTrips } from '@/components/host/host-trips';

export const metadata: Metadata = { title: 'My trips', robots: { index: false } };

export default function HostTripsPage() {
  return <HostTrips />;
}
