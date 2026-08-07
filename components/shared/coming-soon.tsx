'use client';

import { useState } from 'react';
import { Check, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth/auth-provider';
import { useJoinWaitlist, useWaitlistStatus } from '@/lib/hooks/queries';
import { COMING_SOON_COPY } from '@/content/nav';
import type { ComingSoonService } from '@/types';

/**
 * Real route, real layout, real waitlist write — not a stub page. Nothing here
 * pretends the feature works (Section 5.13).
 */
export function ComingSoon({ service }: { service: ComingSoonService }) {
  const copy = COMING_SOON_COPY[service];
  const { profile } = useAuth();
  const status = useWaitlistStatus(service);
  const join = useJoinWaitlist(service);

  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');

  const joined = status.data?.joined || join.isSuccess;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="inline-flex items-center rounded-full border border-line bg-surface-sunken px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-subtle">
        Coming soon
      </div>

      <h1 className="mt-5 font-display text-[32px] font-semibold leading-tight tracking-[-0.035em] text-ink">
        {copy.title}
      </h1>
      <p className="mt-2 text-[17px] leading-relaxed text-ink-muted">{copy.tagline}</p>
      <p className="mt-5 max-w-xl text-[14.5px] leading-relaxed text-ink-muted">
        {copy.description}
      </p>

      <ul className="mt-7 space-y-2.5">
        {copy.bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2.5">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <span className="text-[14px] leading-relaxed text-ink">{bullet}</span>
          </li>
        ))}
      </ul>

      <div className="mt-10 rounded-lg border border-line bg-surface p-6">
        {joined ? (
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand">
              <Check className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[15px] font-semibold text-ink">You&apos;re on the list</p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-ink-muted">
                We&apos;ll email you the moment {copy.title} opens up.
                {status.data && status.data.count > 1
                  ? ` ${status.data.count} people are waiting with you.`
                  : ''}
              </p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const value = email.trim() || (profile?.email ?? '');
              if (!value) return;
              join.mutate({ email: value, note: note.trim() || undefined });
            }}
            className="space-y-3"
          >
            <p className="text-[15px] font-semibold text-ink">Get notified at launch</p>
            <Input
              type="email"
              icon={<Mail className="h-4 w-4" />}
              placeholder={profile?.email ?? 'you@college.edu'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Input
              placeholder="What would you use it for? (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button type="submit" className="w-full" loading={join.isPending}>
              Notify me
            </Button>
            {join.isError ? (
              <p role="alert" className="text-[13px] text-danger">
                {join.error instanceof Error
                  ? join.error.message
                  : "Couldn't join the waitlist."}
              </p>
            ) : null}
          </form>
        )}
      </div>
    </div>
  );
}
