'use client';

import { ShieldAlert } from 'lucide-react';

import { useAuth } from '@/lib/auth/auth-provider';
import { VerifyInstituteBanner } from '@/components/shared/verify-institute';
import { cn } from '@/lib/utils';

/**
 * Stands in for an action an unverified account cannot take.
 *
 * Browsing is open; creating and joining are not — `POST /rides`,
 * `POST /rides/:id/join`, `POST /squads` and `POST /squads/:id/join` all sit
 * behind requireVerifiedInstitute and answer 403. Before this, the button was
 * simply rendered, and the refusal arrived as a raw error after the tap: the
 * user learned they were not allowed only by being told no.
 *
 * So the gate replaces the control rather than disabling it. A disabled button
 * says "not now" without saying why, and there is a why here — one the user can
 * actually resolve, in one step, without leaving the screen: the banner carries
 * the real verification flow, not a link to it.
 *
 * `useVerificationGate` exists for callers that need the boolean rather than
 * the UI, e.g. to decide a button's label before it is pressed.
 */
export function useVerificationGate(): { verified: boolean; ready: boolean } {
  const { profile, status } = useAuth();
  return {
    verified: Boolean(profile?.instituteVerified),
    // Until the profile has loaded, "unverified" is an assumption, not a fact.
    ready: status === 'authenticated' && Boolean(profile),
  };
}

export function VerificationGate({
  action,
  children,
  className,
}: {
  /** What the user was trying to do, e.g. "join this ride". Used in the copy. */
  action: string;
  /** Rendered once the account is verified. */
  children: React.ReactNode;
  className?: string;
}) {
  const { verified, ready } = useVerificationGate();

  // Render the action while the profile is still loading rather than flashing
  // a verification prompt at someone who is already verified.
  if (!ready || verified) return <>{children}</>;

  return (
    <div className={cn('space-y-2.5', className)}>
      <div className="flex items-start gap-2.5 rounded-lg border border-line bg-surface-sunken px-3.5 py-3">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <p className="text-[12.5px] leading-relaxed text-ink-muted">
          <span className="font-medium text-ink">Verify your institute to {action}.</span>{' '}
          Browsing stays open — this is only needed before you travel with someone.
        </p>
      </div>
      <VerifyInstituteBanner />
    </div>
  );
}
