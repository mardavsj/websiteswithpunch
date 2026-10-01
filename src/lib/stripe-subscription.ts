import type Stripe from "stripe";
import {
  getPackConfig,
  isPackPriceId,
  planIdFromStripePriceId,
  PLANS,
  type PlanId,
} from "./plans";
import { daysLeftUntil } from "./billing-format";
import { packPrice, planPrice, type BillingInterval } from "./billing-interval";
import { intervalOfPrice } from "./stripe-prices";

/** Old separate pack Checkout subscriptions (metadata.type === site_pack). */
export function isLegacyPackOnlySubscription(
  subscription: Stripe.Subscription,
): boolean {
  if (subscription.metadata?.type === "site_pack") return true;
  const items = subscription.items?.data ?? [];
  if (items.length === 0) return false;
  return items.every((item) => isPackPriceId(item.price?.id));
}

export function findPlanItem(
  subscription: Stripe.Subscription,
): Stripe.SubscriptionItem | undefined {
  return subscription.items.data.find((item) => !isPackPriceId(item.price?.id));
}

export function findPackItem(
  subscription: Stripe.Subscription,
): Stripe.SubscriptionItem | undefined {
  return subscription.items.data.find((item) => isPackPriceId(item.price?.id));
}

/** Billing interval of the subscription, read from its plan line item. */
export function subscriptionInterval(subscription: Stripe.Subscription): BillingInterval {
  return intervalOfPrice(findPlanItem(subscription)?.price);
}

/** Derive plan + pack quantity from the main subscription's line items. */
export function derivePlanAndPacks(subscription: Stripe.Subscription): {
  plan: PlanId;
  sitePackCount: number;
} {
  const fromMeta = subscription.metadata?.planId;
  const planItem = findPlanItem(subscription);
  let plan: PlanId;
  if (planItem?.price?.id) {
    plan = planIdFromStripePriceId(planItem.price.id);
  } else if (fromMeta === "business" || fromMeta === "pro") {
    plan = fromMeta;
  } else {
    plan = "pro";
  }

  const packItem = findPackItem(subscription);
  const raw = packItem?.quantity ?? 0;
  const config = getPackConfig(plan);
  const sitePackCount = config
    ? Math.max(0, Math.min(raw, config.maxPacks))
    : 0;

  return { plan, sitePackCount };
}

/** Billing period end (Unix seconds). Prefers subscription item fields (Stripe API 2025+). */
export function subscriptionPeriodEnd(
  subscription: Stripe.Subscription,
): number | null {
  const ends = (subscription.items?.data ?? [])
    .map((item) => item.current_period_end)
    .filter((n): n is number => typeof n === "number" && n > 0);
  if (ends.length > 0) return Math.min(...ends);
  const legacy = (subscription as unknown as { current_period_end?: number })
    .current_period_end;
  return typeof legacy === "number" && legacy > 0 ? legacy : null;
}

export function daysLeftInBillingPeriod(
  subscription: Stripe.Subscription,
): number | null {
  return daysLeftUntil(subscriptionPeriodEnd(subscription));
}

/** Unit amount in cents from a Stripe Price (null if missing). */
export function priceUnitAmountCents(
  price: Stripe.Price | string | null | undefined,
): number | null {
  if (!price || typeof price === "string") return null;
  if (typeof price.unit_amount === "number") return price.unit_amount;
  return null;
}

/**
 * Build plain-language recurring breakdown from subscription items
 * after a proposed pack count, e.g. "$12 Pro + $6 for the extra sites"
 * or "$12 Pro + $12 for 10 extra sites".
 */
export function buildRecurringBreakdown(opts: {
  plan: PlanId;
  packCount: number;
  planUnitCents: number | null;
  packUnitCents: number | null;
  currency?: string;
  interval?: BillingInterval;
}): string {
  const { plan, packCount } = opts;
  const planName = plan === "business" ? "Business" : plan === "pro" ? "Pro" : "Free";
  const config = getPackConfig(plan);

  const interval = opts.interval ?? "month";
  const paid = plan === "pro" || plan === "business" ? plan : null;
  const planDollars =
    opts.planUnitCents != null ? opts.planUnitCents / 100 : paid ? planPrice(paid, interval) : 0;
  const packUnitDollars =
    opts.packUnitCents != null ? opts.packUnitCents / 100 : paid ? packPrice(paid, interval) : 0;

  const planPart = `$${trimMoney(planDollars)} ${planName}`;
  if (!config || packCount <= 0) return planPart;

  const packTotal = packUnitDollars * packCount;
  const extraSites = packCount * config.sitesPerPack;
  if (packCount === 1) {
    return `${planPart} + $${trimMoney(packTotal)} for the extra sites`;
  }
  return `${planPart} + $${trimMoney(packTotal)} for ${extraSites} extra sites`;
}

function trimMoney(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export function monthlyTotalDollars(
  plan: PlanId,
  sitePackCount: number,
): number {
  if (plan !== "pro" && plan !== "business") return 0;
  const base = PLANS[plan].price;
  const config = getPackConfig(plan);
  if (!config) return base;
  const packs = Math.max(0, Math.min(sitePackCount, config.maxPacks));
  return base + packs * config.pricePerMonth;
}

/** Per-interval total. Prefer Stripe unit amounts; fall back to catalog prices for the interval. */
export function monthlyTotalCentsFromItems(
  plan: PlanId,
  packCount: number,
  planUnitCents: number | null,
  packUnitCents: number | null,
  interval: BillingInterval = "month",
): number {
  const config = getPackConfig(plan);
  const paid = plan === "pro" || plan === "business" ? plan : null;
  const planCents = planUnitCents ?? (paid ? planPrice(paid, interval) * 100 : 0);
  const packUnit = packUnitCents ?? (paid ? packPrice(paid, interval) * 100 : 0);
  const packs = config ? Math.max(0, Math.min(packCount, config.maxPacks)) : 0;
  return planCents + packs * packUnit;
}

export function formatStripeAmount(
  amountCents: number,
  currency = "usd",
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency || "usd").toUpperCase(),
  }).format(amountCents / 100);
}

export function hostedInvoiceUrlFromSubscription(
  subscription: Stripe.Subscription,
): string | null {
  const invoice = subscription.latest_invoice;
  if (!invoice || typeof invoice === "string") return null;
  return invoice.hosted_invoice_url || null;
}

/**
 * Expand path for the latest invoice's PaymentIntents. Since Stripe API 2025-03-31 an invoice
 * has no `payment_intent`; payments live in `invoice.payments` (must be expanded).
 */
export const LATEST_INVOICE_EXPAND = "latest_invoice.payments.data.payment.payment_intent";

const NEEDS_ACTION = new Set(["requires_action", "requires_payment_method", "requires_confirmation"]);

export function subscriptionNeedsPaymentAction(
  subscription: Stripe.Subscription,
): boolean {
  if (subscription.pending_update) return true;
  const invoice = subscription.latest_invoice;
  if (!invoice || typeof invoice === "string") return false;
  if (invoice.status === "open" || invoice.status === "draft") {
    const needsAction = (invoice.payments?.data ?? []).some(({ payment }) => {
      const pi = payment.payment_intent;
      return Boolean(pi && typeof pi !== "string" && NEEDS_ACTION.has(pi.status));
    });
    if (needsAction) return true;
    if (invoice.hosted_invoice_url && invoice.status === "open") {
      const amountDue = invoice.amount_due ?? 0;
      if (amountDue > 0) return true;
    }
  }
  return false;
}
