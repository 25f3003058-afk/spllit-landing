import { Router, Response } from 'express';

import prisma from '../utils/prisma.js';
import { SQUAD_JOIN_PAYMENT_ENABLED } from '../config/features.js';
import { identify } from '../middleware/identity.js';
import { AuthRequest } from '../types/express.js';
import { ok, fail } from '../utils/respond.js';
import {
  JOIN_FEE_PAISE,
  createOrder,
  isPaymentsConfigured,
  publicKeyId,
  verifySignature,
} from '../services/payments.js';

const router = Router();

/**
 * The squad join fee.
 *
 * Order of events, which is what makes the refund policy defensible:
 *
 *   ask to join  →  leader approves  →  member pays  →  access unlocked
 *
 * Nobody is charged before a leader has agreed to take them, so a rejected
 * request never involves money and there is nothing to refund. Once the leader
 * has approved and the member has paid, the leader has committed a seat — a
 * member who then walks away has consumed that commitment, which is why
 * cancelling after payment is not refunded.
 *
 * Access is granted on a verified signature and nothing else. The browser
 * saying "it worked" is not evidence.
 */

/** GET /api/squads/:id/payment — what the client needs to open checkout. */
router.get('/:id/payment', identify, async (req: AuthRequest, res: Response) => {
  try {
    const membership = await prisma.squadMember.findUnique({
      where: { squadId_userId: { squadId: req.params.id, userId: req.user!.userId } },
      select: { status: true, feePaid: true },
    });

    const existing = await prisma.squadPayment.findUnique({
      where: { squadId_userId: { squadId: req.params.id, userId: req.user!.userId } },
      select: { status: true, paidAt: true },
    });

    return ok(res, {
      configured: isPaymentsConfigured(),
      amountPaise: JOIN_FEE_PAISE,
      currency: 'INR',
      /**
       * Nothing is ever due while the fee is switched off.
       *
       * `due` is what the client renders the fee dialog from, so leaving it
       * computable during the beta would show an approved member a payment
       * screen for a charge that does not exist — and one they could not
       * complete anyway, since the order endpoint answers 503 without
       * Razorpay configured. The flag is checked first for that reason.
       */
      due:
        SQUAD_JOIN_PAYMENT_ENABLED &&
        membership?.status !== undefined &&
        membership.status !== 'pending' &&
        membership.status !== 'left' &&
        !membership.feePaid,
      paid: Boolean(membership?.feePaid),
      status: existing?.status ?? null,
      paidAt: existing?.paidAt ?? null,
    });
  } catch (error) {
    console.error('[squads/payment status]', error);
    return fail(res, 500, 'Could not check the payment status');
  }
});

/** POST /api/squads/:id/payment/order — creates (or reuses) a Razorpay order. */
router.post('/:id/payment/order', identify, async (req: AuthRequest, res: Response) => {
  try {
    /**
     * Refuse before touching Razorpay. During the beta there is no fee, so an
     * order request is a client that has not been updated rather than a
     * misconfigured environment — and answering "not configured" would send
     * someone looking for a missing key that is deliberately absent.
     */
    if (!SQUAD_JOIN_PAYMENT_ENABLED) {
      return fail(res, 409, 'Joining a squad is free during the beta', 'payments-disabled');
    }

    if (!isPaymentsConfigured()) {
      return fail(res, 503, 'Payments are not configured on this environment', 'payments-off');
    }

    const squad = await prisma.squad.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, status: true },
    });
    if (!squad || squad.status !== 'active') {
      return fail(res, 404, 'Squad not found');
    }

    const membership = await prisma.squadMember.findUnique({
      where: { squadId_userId: { squadId: squad.id, userId: req.user!.userId } },
      select: { id: true, status: true, feePaid: true },
    });

    /**
     * The gate that makes "no refund" fair: you cannot pay before a leader has
     * approved you, so money never changes hands on a request that might be
     * turned down.
     */
    if (!membership || membership.status === 'pending') {
      return fail(
        res,
        409,
        'The leader has not approved you yet. You will be asked to pay once they do.',
        'not-approved',
      );
    }
    if (membership.status === 'left') {
      return fail(res, 409, 'You are no longer in this squad', 'not-a-member');
    }
    if (membership.feePaid) {
      return ok(res, { alreadyPaid: true });
    }

    // One row per member per squad; a retry reuses it rather than orphaning
    // orders, and the row id is the receipt Razorpay echoes back.
    const record = await prisma.squadPayment.upsert({
      where: { squadId_userId: { squadId: squad.id, userId: req.user!.userId } },
      create: {
        squadId: squad.id,
        userId: req.user!.userId,
        amountPaise: JOIN_FEE_PAISE,
        status: 'created',
      },
      update: { status: 'created', failureReason: null },
    });

    const order = await createOrder({
      // Server-decided. The client never sends an amount.
      amountPaise: JOIN_FEE_PAISE,
      receipt: record.id,
      notes: { squadId: squad.id, userId: req.user!.userId },
    });

    await prisma.squadPayment.update({
      where: { id: record.id },
      data: { razorpayOrderId: order.id },
    });

    return ok(res, {
      orderId: order.id,
      amountPaise: JOIN_FEE_PAISE,
      currency: 'INR',
      keyId: publicKeyId(),
      squadName: squad.name,
    });
  } catch (error) {
    console.error('[squads/payment order]', error);
    return fail(res, 502, 'Could not start the payment. Try again in a moment.');
  }
});

/** POST /api/squads/:id/payment/verify — confirms a completed checkout. */
router.post('/:id/payment/verify', identify, async (req: AuthRequest, res: Response) => {
  try {
    const orderId = String(req.body?.razorpayOrderId ?? '');
    const paymentId = String(req.body?.razorpayPaymentId ?? '');
    const signature = String(req.body?.razorpaySignature ?? '');

    if (!orderId || !paymentId || !signature) {
      return fail(res, 400, 'Missing payment details');
    }

    const record = await prisma.squadPayment.findUnique({
      where: { squadId_userId: { squadId: req.params.id, userId: req.user!.userId } },
    });
    if (!record) return fail(res, 404, 'No payment was started for this squad');

    // The order must be the one we created — otherwise a valid signature from
    // some other order would unlock this squad.
    if (record.razorpayOrderId !== orderId) {
      return fail(res, 400, 'That payment does not belong to this squad');
    }

    if (!verifySignature({ orderId, paymentId, signature })) {
      await prisma.squadPayment.update({
        where: { id: record.id },
        data: { status: 'failed', failureReason: 'signature-mismatch' },
      });
      console.warn(
        `[security] payment signature mismatch for squad ${req.params.id} user ${req.user!.userId}`,
      );
      return fail(res, 400, 'Payment could not be verified', 'verification-failed');
    }

    // Verified. Record and unlock in one transaction so access can never exist
    // without the payment row that justifies it.
    await prisma.$transaction([
      prisma.squadPayment.update({
        where: { id: record.id },
        data: {
          status: 'paid',
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
          paidAt: new Date(),
        },
      }),
      prisma.squadMember.update({
        where: { squadId_userId: { squadId: req.params.id, userId: req.user!.userId } },
        data: { feePaid: true },
      }),
    ]);

    return ok(res, { paid: true, amountPaise: record.amountPaise });
  } catch (error) {
    console.error('[squads/payment verify]', error);
    return fail(res, 500, 'Could not confirm the payment');
  }
});

export default router;
