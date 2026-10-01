/**
 * Stripe price IDs from env, and the reverse map (price ID → plan/pack + interval) the
 * webhook and billing routes use. Monthly env names are unchanged; annual ones were added.
 */
import type Stripe from "stripe";
import type { PlanId } from "./plans";
import type { BillingInterval, PaidPlanId } from "./billing-interval";

export type PriceKind = "plan" | "pack";

export const PRICE_ENV: Record<PriceKind, Record<PaidPlanId, Record<BillingInterval, string[]>>> = {
  plan: {
    pro: { month: ["STRIPE_PRICE_ID_PRO", "STRIPE_PRICE_ID"], year: ["STRIPE_PRICE_PRO_ANNUAL"] },
    business: { month: ["STRIPE_PRICE_ID_BUSINESS"], year: ["STRIPE_PRICE_BUSINESS_ANNUAL"] },
  },
  pack: {
    pro: { month: ["STRIPE_PRICE_ID_PACK_PRO"], year: ["STRIPE_PRICE_PACK_PRO_ANNUAL"] },
    business: {
      month: ["STRIPE_PRICE_ID_PACK_BUSINESS"],
      year: ["STRIPE_PRICE_PACK_BUSINESS_ANNUAL"],
    },
  },
};

function envValue(name: string): string | null {
  return process.env[name]?.trim() || null;
}

function firstEnv(names: string[]): string | null {
  for (const name of names) {
    const v = envValue(name);
    if (v) return v;
  }
  return null;
}

export function stripePriceIdForPlan(
  planId: PaidPlanId,
  interval: BillingInterval = "month",
): string | null {
  return firstEnv(PRICE_ENV.plan[planId][interval]);
}

export function stripePriceIdForPack(
  planId: PaidPlanId,
  interval: BillingInterval = "month",
): string | null {
  return firstEnv(PRICE_ENV.pack[planId][interval]);
}

/** Clear, fixable message naming the env var, e.g. for a missing annual price. */
export function missingPriceMessage(
  kind: PriceKind,
  planId: PaidPlanId,
  interval: BillingInterval,
): string {
  const what = `${interval === "year" ? "Annual" : "Monthly"} ${
    planId === "business" ? "Business" : "Pro"
  }${kind === "pack" ? " site pack" : ""} price`;
  return `${what} is not configured. Set ${PRICE_ENV[kind][planId][interval].join(" or ")} in the server environment.`;
}

export type PriceInfo = { kind: PriceKind; plan: PaidPlanId; interval: BillingInterval };

/** Reverse lookup over all eight configured price IDs. */
export function lookupStripePrice(priceId: string | null | undefined): PriceInfo | null {
  if (!priceId) return null;
  for (const kind of ["plan", "pack"] as const) {
    for (const plan of ["pro", "business"] as const) {
      for (const interval of ["month", "year"] as const) {
        if (PRICE_ENV[kind][plan][interval].some((n) => envValue(n) === priceId)) {
          return { kind, plan, interval };
        }
      }
    }
  }
  return null;
}

export function isPackPriceId(priceId: string | null | undefined): boolean {
  return lookupStripePrice(priceId)?.kind === "pack";
}

/** Business (monthly or annual) → business; anything else stays "pro" as before. */
export function planIdFromStripePriceId(priceId: string | null | undefined): PlanId {
  const info = lookupStripePrice(priceId);
  return info?.kind === "plan" && info.plan === "business" ? "business" : "pro";
}

/** Interval of a subscription line: Stripe's recurring.interval, else the env map. */
export function intervalOfPrice(
  price: Stripe.Price | string | null | undefined,
): BillingInterval {
  if (price && typeof price !== "string" && price.recurring?.interval) {
    return price.recurring.interval === "year" ? "year" : "month";
  }
  const id = typeof price === "string" ? price : price?.id;
  return lookupStripePrice(id)?.interval ?? "month";
}
