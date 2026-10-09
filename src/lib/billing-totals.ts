/**
 * Recurring totals from the catalog prices (plans.ts / billing-interval.ts), which match the
 * Dodo products 1:1. Client-safe. Dodo adds tax at checkout where it applies.
 */
import { getPackConfig, type PlanId } from "./plans";
import { packPrice, planPrice, type BillingInterval } from "./billing-interval";

function trimMoney(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/** Per-interval total in cents for a plan plus packs (packs clamped to maxPacks). */
export function recurringTotalCents(
  plan: PlanId,
  packCount: number,
  interval: BillingInterval = "month",
): number {
  if (plan !== "pro" && plan !== "business") return 0;
  const config = getPackConfig(plan);
  const packs = config ? Math.max(0, Math.min(packCount, config.maxPacks)) : 0;
  return (planPrice(plan, interval) + packs * packPrice(plan, interval)) * 100;
}

/**
 * Plain-language recurring breakdown, e.g. "$12 Pro + $6 for the extra sites" or
 * "$120 Pro + $120 for 10 extra sites" (annual).
 */
export function recurringBreakdown(
  plan: PlanId,
  packCount: number,
  interval: BillingInterval = "month",
): string {
  const planName = plan === "business" ? "Business" : plan === "pro" ? "Pro" : "Free";
  if (plan !== "pro" && plan !== "business") return planName;
  const planPart = `$${trimMoney(planPrice(plan, interval))} ${planName}`;
  const config = getPackConfig(plan);
  if (!config || packCount <= 0) return planPart;
  const packTotal = packPrice(plan, interval) * packCount;
  if (packCount === 1) return `${planPart} + $${trimMoney(packTotal)} for the extra sites`;
  return `${planPart} + $${trimMoney(packTotal)} for ${packCount * config.sitesPerPack} extra sites`;
}
