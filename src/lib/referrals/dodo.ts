/**
 * Dodo -> referral ledger. Called from the webhook after the signature check and webhook-id claim.
 * Each step is idempotent on its own (Commission.paymentId is unique, reversal is a guarded
 * status flip), so a replayed or reordered event can't double-pay or double-reverse.
 */
import { REFERRAL } from "./config";

export const REFERRAL_EVENTS = new Set([
  "payment.succeeded",
  "refund.succeeded",
  "dispute.opened",
  "dispute.lost",
  "dispute.won",
  "dispute.cancelled",
]);

type PaymentLike = {
  payment_id: string;
  status?: string | null;
  total_amount: number;
  tax?: number | null;
  currency: string;
  subscription_id?: string | null;
  metadata?: Record<string, string> | null;
  customer?: { customer_id?: string; email?: string } | null;
};

/** Commission basis for a payment, or null when it doesn't qualify. Amounts are cents. */
export function paymentBasis(p: PaymentLike): { baseCents: number; currency: string } | null {
  if (p.status && p.status !== "succeeded") return null;
  if (!p.subscription_id) return null; // only Pro/Business subscriptions and their packs
  if (String(p.currency).toUpperCase() !== REFERRAL.currency) return null;
  const base = Math.round(p.total_amount) - Math.max(0, Math.round(p.tax ?? 0));
  return base > 0 ? { baseCents: base, currency: REFERRAL.currency } : null;
}

/** Runs the referral side of a webhook. Throws on API/DB failure so the webhook retries. */
export async function handleReferralEvent(type: string, data: { payment_id?: string | null } | undefined) {
  if (!REFERRAL_EVENTS.has(type) || !data?.payment_id) return "skip";
  const paymentId = data.payment_id;
  const ledger = await import("./ledger");

  if (type === "refund.succeeded") return ledger.reverseCommission(paymentId, "refund");
  if (type === "dispute.opened" || type === "dispute.lost") return ledger.reverseCommission(paymentId, "dispute");
  if (type === "dispute.won" || type === "dispute.cancelled") return ledger.reinstateCommission(paymentId);

  // payment.succeeded: re-read the payment from the API (never trust amounts in the body).
  const [{ getDodo }, { prisma }, { findUserForSubscription }, { notifyEarned }] = await Promise.all([
    import("@/lib/dodo"), import("@/lib/prisma"), import("@/lib/dodo-sync"), import("./notify"),
  ]);
  if (await prisma.commission.findUnique({ where: { paymentId }, select: { id: true } })) return "duplicate";
  const dodo = getDodo();
  if (!dodo) throw new Error("DODO_PAYMENTS_API_KEY missing: cannot read the payment");
  const p = (await dodo.payments.retrieve(paymentId)) as unknown as PaymentLike;
  const basis = paymentBasis(p);
  if (!basis) return "not-eligible";
  const payer = await findUserForSubscription({
    subscription_id: p.subscription_id!, metadata: p.metadata ?? undefined, customer: p.customer ?? undefined,
  } as Parameters<typeof findUserForSubscription>[0]);
  if (!payer?.referredById || payer.referredById === payer.id) return "not-referred";
  const res = await ledger.recordCommission({
    paymentId, referrerId: payer.referredById, referredUserId: payer.id, subscriptionId: p.subscription_id, ...basis,
  });
  if (res.created) await notifyEarned(res.row.referrerId, res.row.amountCents);
  return res.created ? "recorded" : res.reason;
}
