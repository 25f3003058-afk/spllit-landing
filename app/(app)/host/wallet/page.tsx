import type { Metadata } from 'next';
import { Wallet } from 'lucide-react';

export const metadata: Metadata = { title: 'Wallet', robots: { index: false } };

/**
 * Payouts are the last step of the host programme: a ledger only means
 * anything once money actually moves, and that needs Razorpay credentials this
 * environment does not have. The route exists so the host dock is complete and
 * the URL is stable when it lands.
 */
export default function HostWalletPage() {
  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-sunken">
        <Wallet className="h-5 w-5 text-ink-subtle" />
      </span>
      <h1 className="mt-4 font-display text-[20px] font-semibold tracking-[-0.02em] text-ink">
        Wallet
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-ink-muted">
        Fares and tips riders pay you will land here, with a running balance and
        payouts to your bank. Payments are the next milestone — nothing is
        collected or held yet.
      </p>
    </div>
  );
}
