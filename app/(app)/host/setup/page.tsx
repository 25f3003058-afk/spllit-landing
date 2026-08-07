import type { Metadata } from 'next';

import { HostSetup } from '@/components/host/host-setup';

export const metadata: Metadata = { title: 'Become a host', robots: { index: false } };

export default function HostSetupPage() {
  return <HostSetup />;
}
