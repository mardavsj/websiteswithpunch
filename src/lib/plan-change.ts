/**
 * In-place subscription change (Pro → Business, or monthly → annual), shared by
 * /api/stripe/checkout and /api/stripe/preview-plan so the preview matches what is charged.
 * Every line on one Stripe subscription must share one interval, so packs either move to the
 * matching pack price (same plan, new interval) or are removed (plan change, as before).
 */
import type Stripe from "stripe";
import { PLANS, type PlanId } from "./plans";
import { intervalLabel, type BillingInterval, type PaidPlanId } from "./billing-interval";
import { missingPriceMessage, stripePriceIdForPack, stripePriceIdForPlan } from "./stripe-prices";
import { findPackItem, findPlanItem, subscriptionInterval } from "./stripe-subscription";

export type PlanChangeItem = {
  id?: string;
  price?: string;
  quantity?: number;
  deleted?: boolean;
};

export type PlanChange =
  | {
      ok: true;
      items: PlanChangeItem[];
      samePlan: boolean;
      currentInterval: BillingInterval;
      intervalChanges: boolean;
      /** Pack quantity kept on the new interval (0 when packs are dropped). */
      keptPacks: number;
      droppedPacks: boolean;
    }
  | { ok: false; status: number; error: string; code?: string };

export function planChangeItems(
  subscription: Stripe.Subscription,
  currentPlan: PlanId,
  target: PaidPlanId,
  interval: BillingInterval,
): PlanChange {
  const currentInterval = subscriptionInterval(subscription);
  const samePlan = currentPlan === target;
  if (samePlan && currentInterval === interval) {
    return {
      ok: false,
      status: 400,
      error: `You're already on ${PLANS[target].name} with ${intervalLabel(interval).toLowerCase()} billing.`,
    };
  }
  if (currentPlan === "business" && target === "pro") {
    return {
      ok: false,
      status: 400,
      error: "To switch to Pro, use Switch to Pro in Your plan (takes effect at renewal).",
      code: "USE_DOWNGRADE",
    };
  }
  if (currentInterval === "year" && interval === "month") {
    return {
      ok: false,
      status: 400,
      error: "You're billed yearly, so plan changes stay on annual billing. Choose Annual.",
      code: "ANNUAL_ONLY",
    };
  }

  const priceId = stripePriceIdForPlan(target, interval);
  if (!priceId) {
    return { ok: false, status: 503, error: missingPriceMessage("plan", target, interval) };
  }

  const planItem = findPlanItem(subscription);
  const packItem = findPackItem(subscription);
  const items: PlanChangeItem[] = [
    planItem ? { id: planItem.id, price: priceId } : { price: priceId, quantity: 1 },
  ];

  let keptPacks = 0;
  if (packItem && samePlan) {
    const packPriceId = stripePriceIdForPack(target, interval);
    if (!packPriceId) {
      return { ok: false, status: 503, error: missingPriceMessage("pack", target, interval) };
    }
    keptPacks = packItem.quantity ?? 0;
    items.push({ id: packItem.id, price: packPriceId, quantity: keptPacks });
  } else if (packItem) {
    // Business includes 50 sites; Pro packs are a different price and must not carry over.
    items.push({ id: packItem.id, deleted: true });
  }

  return {
    ok: true,
    items,
    samePlan,
    currentInterval,
    intervalChanges: currentInterval !== interval,
    keptPacks,
    droppedPacks: Boolean(packItem) && !samePlan,
  };
}

/** Renewal after the change: unchanged, or one new interval from now when the interval changes. */
export function renewalAfterChange(
  periodEndSec: number | null,
  intervalChanges: boolean,
  interval: BillingInterval,
  now = new Date(),
): Date | null {
  if (!intervalChanges) return periodEndSec ? new Date(periodEndSec * 1000) : null;
  const d = new Date(now);
  if (interval === "year") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
}
