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

/** Pre-tax payment total, or null when it doesn't qualify. Amounts are cents. */
export function paymentBasis(p: PaymentLike): { baseCents: number; currency: string } | null {
  if (p.status && p.status !== "succeeded") return null;
  if (!p.subscription_id) return null; // only Pro/Business subscriptions
  if (String(p.currency).toUpperCase() !== REFERRAL.currency) return null;
  const base = Math.round(p.total_amount) - Math.max(0, Math.round(p.tax ?? 0));
  return base > 0 ? { baseCents: base, currency: REFERRAL.currency } : null;
}

/** Runs the referral side of a webhook. Throws on API/DB failure so the webhook retries. */
export async function handleReferralEvent(type: string, data: { payment_id?: string | null } | undefined) {
  if (!REFERRAL_EVENTS.has(type) || !data?.payment_id) return "skip";
  const paymentId = data.payment_id;
  const ledger = await import("./ledger");

  const changed = async <T>(r: T) => {
    if (r === "reversed" || r === "reinstated") await (await import("./notify")).notifyAdminsIfOpenPayoutChanged(paymentId);
    return r;
  };
  if (type === "refund.succeeded") return changed(await ledger.reverseCommission(paymentId, "refund"));
  if (type === "dispute.opened" || type === "dispute.lost") return changed(await ledger.reverseCommission(paymentId, "dispute"));
  if (type === "dispute.won" || type === "dispute.cancelled") return changed(await ledger.reinstateCommission(paymentId));

  // payment.succeeded: re-read the payment from the API (never trust amounts in the body).
  const [{ getDodo }, { prisma }, { findUserForSubscription }, { notifyEarned }] = await Promise.all([
    import("@/lib/dodo"), import("@/lib/prisma"), import("@/lib/dodo-sync"), import("./notify"),
  ]);
  if (await prisma.commission.findUnique({ where: { paymentId }, select: { id: true } })) return "duplicate";
  const dodo = getDodo();
  if (!dodo) throw new Error("DODO_PAYMENTS_API_KEY missing: cannot read the payment");
  const p = (await dodo.payments.retrieve(paymentId)) as unknown as PaymentLike;
  const total = paymentBasis(p);
  if (!total) return "not-eligible";
  const plan = await planPortion(dodo, p, total.baseCents);
  if (plan.planCents <= 0) {
    if (plan.source === "unmatched") console.warn("[referrals] no plan portion found, review manually", paymentId);
    return "no-plan-portion";
  }
  const basis = { baseCents: plan.planCents, currency: total.currency };
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

/** Plan share of the payment (site packs excluded); see basis.ts for the rules. */
async function planPortion(dodo: NonNullable<ReturnType<typeof import("@/lib/dodo").getDodo>>, p: PaymentLike, preTaxCents: number) {
  const [{ planBasis }, { lookupCatalogId }] = await Promise.all([import("./basis"), import("@/lib/dodo-products")]);
  const items = await dodo.payments.retrieveLineItems(p.payment_id).then((r) => r.items, () => null);
  let sub = null;
  if (!items?.length || !items.every((i) => lookupCatalogId(i.items_id))) {
    const s = await dodo.subscriptions.retrieve(p.subscription_id!);
    const k = lookupCatalogId(s.product_id);
    const packs = (s.addons ?? []).reduce((n, a) => n + (lookupCatalogId(a.addon_id)?.kind === "pack" ? a.quantity : 0), 0);
    if (k?.kind === "plan") sub = { plan: k.plan, interval: k.interval, packs };
  }
  return planBasis({ preTaxCents, totalCents: Math.round(p.total_amount), items, sub, classify: lookupCatalogId });
}
