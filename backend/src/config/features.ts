/**
 * Product feature flags, read once at startup.
 *
 * These decide behaviour that is deliberately different during the beta, and
 * they exist so that difference is one boolean in one place rather than a
 * condition copied into every handler that touches it.
 */

/**
 * Whether joining a squad requires the ₹2 matching fee.
 *
 * FALSE for the beta, and that is not a temporary patch around a broken
 * integration — it is the product decision. The Razorpay implementation stays
 * exactly where it is so switching this back on restores the paid flow without
 * rebuilding membership, chat or authorisation.
 *
 * It matters more than it looks. Chat access used to be gated on `feePaid`,
 * and with payments unconfigured the order endpoint answered 503 — so an
 * accepted member could not open the squad chat *and* could not pay to unlock
 * it. Accepted, and silently locked out, with no route forward. Membership is
 * what grants access while this is false.
 *
 * Set SQUAD_JOIN_PAYMENT_ENABLED=true in the environment to re-enable charging.
 */
export const SQUAD_JOIN_PAYMENT_ENABLED =
  String(process.env.SQUAD_JOIN_PAYMENT_ENABLED ?? 'false').toLowerCase() === 'true';

/**
 * True when a member may use the members-only surfaces — chat, calling,
 * live position — for a squad they belong to.
 *
 * One helper rather than the same condition inline in each caller, because the
 * rule changes with the flag and the surfaces must never disagree about who is
 * inside a squad.
 */
export function squadMemberHasAccess(input: {
  role: string;
  feePaid: boolean;
}): boolean {
  // The leader created the squad and was never charged; gating them out of
  // their own group chat would be absurd. True under either flag setting.
  if (input.role === 'leader') return true;
  if (!SQUAD_JOIN_PAYMENT_ENABLED) return true;
  return input.feePaid;
}
