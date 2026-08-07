import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Razorpay integration.
 *
 * Written against Razorpay's REST API with fetch rather than pulling in their
 * SDK: the two calls needed here are an order create and a signature check, and
 * the SDK's value is mostly in the surface this does not use.
 *
 * The two rules that matter and are easy to get wrong:
 *
 *  1. **Never trust the client's word that a payment succeeded.** Razorpay's
 *     checkout hands the browser a payment id and a signature. Both are
 *     attacker-controlled until the signature is verified server-side with the
 *     key secret, which is the only thing proving Razorpay produced them.
 *  2. **Amounts are decided server-side.** The client says "I want to join
 *     squad X", never "charge me ₹2" — otherwise it can say ₹0.
 */

/** The join fee, in paise. Money is never a float. */
export const JOIN_FEE_PAISE = 200;

export function isPaymentsConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

/** Public key id — safe to hand the browser; checkout needs it. */
export function publicKeyId(): string | null {
  return process.env.RAZORPAY_KEY_ID ?? null;
}

function authHeader(): string {
  const token = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`,
  ).toString('base64');
  return `Basic ${token}`;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

/**
 * Creates an order. `receipt` is our own id for it, which is what makes the
 * call idempotent from our side — a retry for the same membership reuses the
 * row and therefore the same receipt.
 */
export async function createOrder(input: {
  amountPaise: number;
  receipt: string;
  notes: Record<string, string>;
}): Promise<RazorpayOrder> {
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: 'INR',
      receipt: input.receipt,
      notes: input.notes,
      // Capture immediately: an authorised-but-uncaptured payment expires and
      // silently refunds, which would leave a member who paid without access.
      payment_capture: 1,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Razorpay order failed (${response.status}): ${body.slice(0, 300)}`);
  }

  return (await response.json()) as RazorpayOrder;
}

/**
 * Verifies that Razorpay — and not the caller — produced this payment.
 *
 * HMAC-SHA256 over `order_id|payment_id` with the key secret, compared in
 * constant time. A plain `===` here would leak the expected signature a byte at
 * a time to anyone willing to measure.
 */
export function verifySignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const expected = createHmac('sha256', secret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest('hex');

  const provided = input.signature;
  // timingSafeEqual throws on a length mismatch, which is itself a signal, so
  // the length is checked first and answered identically.
  if (expected.length !== provided.length) return false;

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  } catch {
    return false;
  }
}

/**
 * Verifies a webhook body against the webhook secret.
 *
 * A separate secret from the key secret, and worth wiring up: the browser can
 * close between payment and confirmation, and the webhook is the only path that
 * still tells us the money arrived.
 */
export function verifyWebhook(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  if (expected.length !== signature.length) return false;

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
