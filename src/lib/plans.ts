export type PlanId = "free" | "pro";

export const PLANS = {
  free: {
    id: "free" as const,
    name: "Free",
    price: 0,
    siteLimit: 1,
    description: "Monitor one site with uptime, SSL, and domain checks.",
  },
  pro: {
    id: "pro" as const,
    name: "Pro",
    price: 12,
    siteLimit: 10,
    description: "Monitor up to 10 sites with priority checks and billing portal.",
  },
} as const;

export function getSiteLimit(plan: string | null | undefined): number {
  if (plan === "pro") return PLANS.pro.siteLimit;
  return PLANS.free.siteLimit;
}

export function isPro(plan: string | null | undefined, stripeStatus?: string | null): boolean {
  return plan === "pro" && (!stripeStatus || stripeStatus === "active" || stripeStatus === "trialing");
}
