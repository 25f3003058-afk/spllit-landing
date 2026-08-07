import type { Metadata } from 'next';

import { HostDashboard } from '@/components/host/host-dashboard';

export const metadata: Metadata = { title: 'Host', robots: { index: false } };

export default function HostPage() {
  return <HostDashboard />;
}
