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
    description:
      "Monitor up to 10 sites, with optional +5 site packs when you need more.",
    highlight: true,
  },
  business: {
    id: "business" as const,
    name: "Business",
    price: 42,
    siteLimit: 50,
    description:
      "Monitor up to 50 sites, with optional +10 site packs for larger portfolios.",
    highlight: false,
  },
} as const;

/** Dashboard-only add-on packs (not separate homepage plans). */
export const SITE_PACKS = {
  pro: {
    planId: "pro" as const,
    sitesPerPack: 5,
    pricePerMonth: 6,
    maxPacks: 4, // 10 + 4×5 = 30
  },
  business: {
    planId: "business" as const,
    sitesPerPack: 10,
    pricePerMonth: 9,
    maxPacks: 5, // 50 + 5×10 = 100
  },
} as const;

export type PackPlanId = keyof typeof SITE_PACKS;

export const PAID_PLAN_IDS: PlanId[] = ["pro", "business"];

export function getSiteLimit(plan: string | null | undefined): number {
  if (plan === "business") return PLANS.business.siteLimit;
  if (plan === "pro") return PLANS.pro.siteLimit;
  return PLANS.free.siteLimit;
}

export function getPackConfig(plan: string | null | undefined) {
  if (plan === "pro") return SITE_PACKS.pro;
  if (plan === "business") return SITE_PACKS.business;
  return null;
}

/** Base plan limit + purchased packs (clamped to maxPacks). Free ignores packs. */
export function getEffectiveSiteLimit(
  plan: string | null | undefined,
  sitePackCount: number | null | undefined,
): number {
  const base = getSiteLimit(plan);
  const config = getPackConfig(plan);
  if (!config) return base;
  const packs = Math.max(0, Math.min(sitePackCount ?? 0, config.maxPacks));
  return base + packs * config.sitesPerPack;
}

export function canBuySitePack(
  plan: string | null | undefined,
  sitePackCount: number | null | undefined,
): boolean {
  const config = getPackConfig(plan);
  if (!config) return false;
  return (sitePackCount ?? 0) < config.maxPacks;
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

export function stripePriceIdForPack(planId: PackPlanId): string | null {
  if (planId === "business") {
    return process.env.STRIPE_PRICE_ID_PACK_BUSINESS || null;
  }
  return process.env.STRIPE_PRICE_ID_PACK_PRO || null;
}

export function isPackPriceId(priceId: string | null | undefined): boolean {
  if (!priceId) return false;
  const pro = process.env.STRIPE_PRICE_ID_PACK_PRO;
  const business = process.env.STRIPE_PRICE_ID_PACK_BUSINESS;
  return Boolean((pro && priceId === pro) || (business && priceId === business));
}

export function planIdFromStripePriceId(priceId: string | null | undefined): PlanId {
  if (!priceId) return "pro";
  const business = process.env.STRIPE_PRICE_ID_BUSINESS;
  if (business && priceId === business) return "business";
  return "pro";
}
