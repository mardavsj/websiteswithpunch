/** Client-safe billing interval helpers (no env or SDK imports). */
import { PLANS, SITE_PACKS } from "./plans";

export type BillingInterval = "month" | "year";
export type PaidPlanId = "pro" | "business";

/** Annual = 2 months free (10 × the monthly price). */
export const ANNUAL_PRICES = { pro: 120, business: 420 } as const;
/** Annual site packs, same 2-months-free rule: Pro +5 = $60/yr, Business +10 = $90/yr. */
export const ANNUAL_PACK_PRICES = { pro: 60, business: 90 } as const;

/** Accepts "annual" / "year" / "yearly" (query strings, bodies); anything else is monthly. */
export function parseInterval(raw: unknown): BillingInterval {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v === "annual" || v === "year" || v === "yearly" ? "year" : "month";
}

/** Value used in URLs: /signup?plan=pro&interval=annual */
export function intervalParam(interval: BillingInterval): "annual" | "monthly" {
  return interval === "year" ? "annual" : "monthly";
}

export function intervalLabel(interval: BillingInterval): "Annual" | "Monthly" {
  return interval === "year" ? "Annual" : "Monthly";
}

export function periodWord(interval: BillingInterval): "year" | "month" {
  return interval === "year" ? "year" : "month";
}

/** Whole-period plan price in dollars ($12 monthly, $120 yearly). */
export function planPrice(plan: PaidPlanId, interval: BillingInterval): number {
  return interval === "year" ? ANNUAL_PRICES[plan] : PLANS[plan].price;
}

/** Whole-period price of one site pack in dollars ($6 monthly, $60 yearly). */
export function packPrice(plan: PaidPlanId, interval: BillingInterval): number {
  return interval === "year" ? ANNUAL_PACK_PRICES[plan] : SITE_PACKS[plan].pricePerMonth;
}

/** What the plan costs per month on this interval ($10 for Pro annual). */
export function perMonthPrice(plan: PaidPlanId, interval: BillingInterval): number {
  return interval === "year" ? ANNUAL_PRICES[plan] / 12 : PLANS[plan].price;
}

/** "$120/year" or "$12/month". */
export function formatPlanPrice(plan: PaidPlanId, interval: BillingInterval): string {
  return `$${planPrice(plan, interval)}/${periodWord(interval)}`;
}
