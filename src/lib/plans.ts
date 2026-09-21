export type PlanId = "free" | "pro" | "business";

export const PLANS = {
  free: {
    id: "free" as const,
    name: "Free",
    price: 0,
    siteLimit: 1,
    description: "Monitor one site with uptime, SSL, and domain checks.",
    highlight: false,
  },
  pro: {
    id: "pro" as const,
    name: "Pro",
    price: 12,
    siteLimit: 10,
    description: "Monitor up to 10 sites with billing portal access.",
    highlight: true,
  },
  business: {
    id: "business" as const,
    name: "Business",
    price: 39,
    siteLimit: 50,
    description: "Monitor up to 50 sites for agencies and multi-brand teams.",
    highlight: false,
  },
} as const;

export const PAID_PLAN_IDS: PlanId[] = ["pro", "business"];

export function getSiteLimit(plan: string | null | undefined): number {
  if (plan === "business") return PLANS.business.siteLimit;
  if (plan === "pro") return PLANS.pro.siteLimit;
  return PLANS.free.siteLimit;
}

/** Active paid plan, or free if canceled / missing. */
export function getEffectivePlan(
  plan: string | null | undefined,
  stripeStatus?: string | null,
): PlanId {
  const active =
    !stripeStatus || stripeStatus === "active" || stripeStatus === "trialing";
  if (active && (plan === "pro" || plan === "business")) return plan;
  return "free";
}

export function isPaidPlan(
  plan: string | null | undefined,
  stripeStatus?: string | null,
): boolean {
  return getEffectivePlan(plan, stripeStatus) !== "free";
}

/** @deprecated Prefer isPaidPlan / getEffectivePlan */
export function isPro(
  plan: string | null | undefined,
  stripeStatus?: string | null,
): boolean {
  return isPaidPlan(plan, stripeStatus);
}

export function stripePriceIdForPlan(planId: "pro" | "business"): string | null {
  if (planId === "business") {
    return process.env.STRIPE_PRICE_ID_BUSINESS || null;
  }
  return process.env.STRIPE_PRICE_ID_PRO || process.env.STRIPE_PRICE_ID || null;
}

export function planIdFromStripePriceId(priceId: string | null | undefined): PlanId {
  if (!priceId) return "pro";
  const business = process.env.STRIPE_PRICE_ID_BUSINESS;
  if (business && priceId === business) return "business";
  return "pro";
}
