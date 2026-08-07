import type { Metadata } from 'next';

import { HostVehicles } from '@/components/host/host-vehicles';

export const metadata: Metadata = { title: 'Vehicles', robots: { index: false } };

export default function HostVehiclesPage() {
  return <HostVehicles />;
}
