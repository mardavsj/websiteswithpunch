import type Stripe from "stripe";
import {
  getPackConfig,
  isPackPriceId,
  planIdFromStripePriceId,
  PLANS,
  type PlanId,
} from "./plans";
import { daysLeftUntil } from "./billing-format";

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
}): string {
  const { plan, packCount } = opts;
  const planName = plan === "business" ? "Business" : plan === "pro" ? "Pro" : "Free";
  const config = getPackConfig(plan);

  const planDollars =
    opts.planUnitCents != null
      ? opts.planUnitCents / 100
      : plan === "pro" || plan === "business"
        ? PLANS[plan].price
        : 0;
  const packUnitDollars =
    opts.packUnitCents != null
      ? opts.packUnitCents / 100
      : config?.pricePerMonth ?? 0;

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

/** Prefer Stripe unit amounts; fall back to catalog prices. */
export function monthlyTotalCentsFromItems(
  plan: PlanId,
  packCount: number,
  planUnitCents: number | null,
  packUnitCents: number | null,
): number {
  const config = getPackConfig(plan);
  const planCents =
    planUnitCents ??
    (plan === "pro" || plan === "business" ? PLANS[plan].price * 100 : 0);
  const packUnit =
    packUnitCents ?? (config ? config.pricePerMonth * 100 : 0);
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

export function subscriptionNeedsPaymentAction(
  subscription: Stripe.Subscription,
): boolean {
  if (subscription.pending_update) return true;
  const invoice = subscription.latest_invoice;
  if (!invoice || typeof invoice === "string") return false;
  if (invoice.status === "open" || invoice.status === "draft") {
    const pi = invoice.payment_intent;
    if (pi && typeof pi !== "string") {
      if (
        pi.status === "requires_action" ||
        pi.status === "requires_payment_method" ||
        pi.status === "requires_confirmation"
      ) {
        return true;
      }
    }
    if (invoice.hosted_invoice_url && invoice.status === "open") {
      const amountDue = invoice.amount_due ?? 0;
      if (amountDue > 0) return true;
    }
  }
  return false;
}
