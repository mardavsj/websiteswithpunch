/**
 * Commission basis = the pre-tax PLAN portion of a payment. Site packs (Dodo add-ons on the same
 * subscription) never earn commission. Pure; amounts are cents.
 *
 * 1. Line items (preferred): sum the items whose id is a configured plan product. Prorated
 *    upgrades bill the plan's prorated difference as the plan line, so that amount is used as-is.
 *    If every item is a pack (pack added mid-cycle) the basis is 0. An item we can't classify
 *    sends us to step 2 instead of guessing.
 * 2. List price fallback: when the pre-tax total is exactly a full cycle (plan + n packs at list
 *    price) the plan list price is used. Any other amount (proration, pack-only, discount) can't be
 *    split safely, so the basis is 0 and the webhook logs it for manual review.
 * Either way the basis is never more than the pre-tax payment total.
 */
import { planPrice, packPrice, type BillingInterval, type PaidPlanId } from "../billing-interval";
import { SITE_PACKS } from "../plans";

export type Kind = { kind: "plan" | "pack"; plan: PaidPlanId; interval: BillingInterval } | null;
export type Item = { items_id: string; amount: number; tax?: number | null; name?: string | null };
export type Basis = { planCents: number; source: "line-items" | "list-price" | "unmatched" };

export function planBasis(opts: {
  preTaxCents: number;
  totalCents: number;
  items?: Item[] | null;
  /** Plan + interval + pack count of the subscription (for the fallback). */
  sub?: { plan: PaidPlanId; interval: BillingInterval; packs: number } | null;
  classify: (id: string) => Kind;
}): Basis {
  const cap = (n: number) => Math.max(0, Math.min(Math.round(n), opts.preTaxCents));
  const items = opts.items ?? [];
  if (items.length && items.every((i) => opts.classify(i.items_id))) {
    // Dodo item amounts may include tax; if they add up to the gross total, strip each item's tax.
    const sum = items.reduce((s, i) => s + i.amount, 0);
    const gross = sum === opts.totalCents && opts.totalCents !== opts.preTaxCents;
    const plan = items
      .filter((i) => opts.classify(i.items_id)!.kind === "plan")
      .reduce((s, i) => s + i.amount - (gross ? Math.max(0, i.tax ?? 0) : 0), 0);
    return { planCents: cap(plan), source: "line-items" };
  }
  const s = opts.sub;
  if (s) {
    const plan = planPrice(s.plan, s.interval) * 100;
    const pack = packPrice(s.plan, s.interval) * 100;
    for (let n = 0; n <= SITE_PACKS[s.plan].maxPacks; n++) {
      if (opts.preTaxCents === plan + n * pack) return { planCents: cap(plan), source: "list-price" };
    }
  }
  return { planCents: 0, source: "unmatched" };
}
