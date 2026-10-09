/**
 * Pure helpers over a Dodo subscription (API response or webhook `data`). One subscription
 * per customer: the plan is the product, site packs are the matching add-on's quantity, and a
 * change booked for the renewal date shows up as `scheduled_change`.
 */
import { getPackConfig, type PlanId } from "./plans";
import type { BillingInterval, PaidPlanId } from "./billing-interval";
import { lookupCatalogId } from "./dodo-products";

type AddonQty = { addon_id: string; quantity: number };

/** The fields we read; the SDK's Subscription type satisfies it. */
export type SubLike = {
  subscription_id: string;
  status: string;
  product_id: string;
  addons?: AddonQty[] | null;
  cancel_at_next_billing_date?: boolean | null;
  next_billing_date?: string | null;
  payment_frequency_interval?: string | null;
  customer?: { customer_id: string; email?: string | null } | null;
  metadata?: Record<string, unknown> | null;
  scheduled_change?: {
    product_id: string;
    effective_at: string;
    addons?: AddonQty[] | null;
  } | null;
};

/** Statuses that keep the paid plan: active, and past_due (Dodo's grace period). */
export const PAID_STATUSES = new Set(["active", "past_due"]);
/** Subscriptions that can never come back; the customer has to subscribe again. */
export const ENDED_STATUSES = new Set(["cancelled", "expired", "failed"]);

export function isPaidStatus(status: string | null | undefined): boolean {
  return Boolean(status && PAID_STATUSES.has(status));
}

/** Plan + interval of a product ID; interval falls back to the subscription's frequency. */
function planOfProduct(
  productId: string,
  frequency?: string | null,
): { plan: PaidPlanId; interval: BillingInterval } | null {
  const info = lookupCatalogId(productId);
  if (info?.kind === "plan") return { plan: info.plan, interval: info.interval };
  if (!info) return null;
  return { plan: info.plan, interval: frequency === "Year" ? "year" : "month" };
}

/** Pack add-on quantity for this plan (other add-ons ignored), clamped to maxPacks. */
export function packCountOf(addons: AddonQty[] | null | undefined, plan: PlanId): number {
  const config = getPackConfig(plan);
  if (!config) return 0;
  let qty = 0;
  for (const a of addons ?? []) {
    const info = lookupCatalogId(a.addon_id);
    if (info?.kind === "pack" && info.plan === plan) qty += a.quantity;
  }
  return Math.max(0, Math.min(qty, config.maxPacks));
}

export type ScheduledState = {
  plan: PaidPlanId;
  interval: BillingInterval;
  packs: number;
  at: Date;
};

export type SubscriptionState = {
  status: string;
  /** null when the product is not one of ours (unknown env / other brand). */
  plan: PaidPlanId | null;
  interval: BillingInterval;
  packs: number;
  cancelAtPeriodEnd: boolean;
  /** End of the paid period (= next billing date). */
  periodEnd: Date | null;
  scheduled: ScheduledState | null;
};

function toDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function subscriptionState(sub: SubLike): SubscriptionState {
  const current = planOfProduct(sub.product_id, sub.payment_frequency_interval);
  const plan = current?.plan ?? null;
  let scheduled: ScheduledState | null = null;
  const sc = sub.scheduled_change;
  const target = sc ? planOfProduct(sc.product_id) : null;
  const at = sc ? toDate(sc.effective_at) : null;
  if (sc && target && at) {
    scheduled = { ...target, packs: packCountOf(sc.addons, target.plan), at };
  }
  return {
    status: sub.status,
    plan,
    interval: current?.interval ?? "month",
    packs: plan ? packCountOf(sub.addons, plan) : 0,
    cancelAtPeriodEnd: Boolean(sub.cancel_at_next_billing_date),
    periodEnd: toDate(sub.next_billing_date),
    scheduled,
  };
}

/** What a scheduled change does, for messages and guards. */
export function scheduledKind(
  s: SubscriptionState,
): "none" | "interval" | "downgrade" | "packs" {
  const sc = s.scheduled;
  if (!sc) return "none";
  if (sc.interval !== s.interval) return "interval";
  if (sc.plan !== s.plan) return "downgrade";
  return "packs";
}

export function daysLeftInPeriod(s: SubscriptionState, nowMs = Date.now()): number | null {
  if (!s.periodEnd) return null;
  const ms = s.periodEnd.getTime() - nowMs;
  return ms <= 0 ? 0 : Math.ceil(ms / 86400000);
}
