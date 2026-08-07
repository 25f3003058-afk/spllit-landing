import type { Metadata } from 'next';

import { InvitesInbox } from '@/components/trip/invites-inbox';

export const metadata: Metadata = { title: 'Invites', robots: { index: false } };

export default function InvitesPage() {
  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <h1 className="font-display text-[20px] font-semibold tracking-[-0.02em] text-ink">
          Invites
        </h1>
        <p className="mt-1 text-[13.5px] text-ink-muted">
          Hosts driving your way, and the trips you&apos;ve joined.
        </p>
      </div>
      <InvitesInbox />
    </div>
  );
}
