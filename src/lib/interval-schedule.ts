/**
 * Annual → monthly switch at renewal, via a Stripe subscription schedule:
 * phase 1 keeps the current annual items until the paid year ends, phase 2 moves the plan
 * (and any packs) to the monthly prices. Both phases use proration_behavior "none", so the
 * remaining annual time is never credited or refunded. Pure helpers (unit-tested).
 */
import type Stripe from "stripe";
import type { PaidPlanId } from "./billing-interval";
import {
  missingPriceMessage,
  planIdFromStripePriceId,
  stripePriceIdForPack,
  stripePriceIdForPlan,
} from "./stripe-prices";
import {
  findPackItem,
  findPlanItem,
  subscriptionInterval,
  subscriptionPeriodEnd,
} from "./stripe-subscription";

export type PhaseItem = { price: string; quantity: number };

export function scheduleId(sub: Stripe.Subscription): string | null {
  const s = sub.schedule;
  if (!s) return null;
  return typeof s === "string" ? s : s.id;
}

/**
 * "pending": a schedule is attached while still on annual billing (switch not yet happened).
 * "stale": the switch already happened; the schedule is only finishing its monthly phase and
 * can be released before other changes. "none": no schedule.
 */
export function scheduleState(sub: Stripe.Subscription): "none" | "pending" | "stale" {
  if (!scheduleId(sub)) return "none";
  return subscriptionInterval(sub) === "year" ? "pending" : "stale";
}

export type MonthlySwitch =
  | {
      ok: true;
      plan: PaidPlanId;
      packs: number;
      /** Unix seconds: end of the paid year = first monthly billing date. */
      switchAt: number;
      currentItems: PhaseItem[];
      nextItems: PhaseItem[];
    }
  | { ok: false; status: number; error: string; code?: string };

const fail = (status: number, error: string, code?: string): MonthlySwitch => ({
  ok: false,
  status,
  error,
  code,
});

export function monthlySwitchPlan(sub: Stripe.Subscription): MonthlySwitch {
  if (subscriptionInterval(sub) !== "year") return fail(400, "You're already billed monthly.");
  if (scheduleId(sub)) {
    return fail(409, "A switch to monthly billing is already scheduled.", "SWITCH_PENDING");
  }
  if (sub.cancel_at_period_end) {
    return fail(400, "Your plan is set to end at renewal. Resume it first to switch to monthly.");
  }
  const switchAt = subscriptionPeriodEnd(sub);
  if (!switchAt) {
    return fail(500, "Could not determine your renewal date. Try again or open Manage billing.");
  }
  const plan: PaidPlanId =
    planIdFromStripePriceId(findPlanItem(sub)?.price?.id) === "business" ? "business" : "pro";
  const planPriceId = stripePriceIdForPlan(plan, "month");
  if (!planPriceId) return fail(503, missingPriceMessage("plan", plan, "month"), "PRICE_MISSING");
  const packs = findPackItem(sub)?.quantity ?? 0;
  const packPriceId = packs > 0 ? stripePriceIdForPack(plan, "month") : null;
  if (packs > 0 && !packPriceId) {
    return fail(503, missingPriceMessage("pack", plan, "month"), "PRICE_MISSING");
  }
  return {
    ok: true,
    plan,
    packs,
    switchAt,
    currentItems: sub.items.data.map((i) => ({ price: i.price.id, quantity: i.quantity ?? 1 })),
    nextItems: [
      { price: planPriceId, quantity: 1 },
      ...(packPriceId ? [{ price: packPriceId, quantity: packs }] : []),
    ],
  };
}

/** Phases for subscriptionSchedules.update (end_behavior "release" keeps it monthly after). */
export function monthlySwitchPhases(
  sw: Extract<MonthlySwitch, { ok: true }>,
  currentPhaseStart: number,
) {
  return [
    {
      items: sw.currentItems,
      start_date: currentPhaseStart,
      end_date: sw.switchAt,
      proration_behavior: "none" as const,
    },
    {
      items: sw.nextItems,
      duration: { interval: "month" as const, interval_count: 1 },
      proration_behavior: "none" as const,
    },
  ];
}

/** Pending switch read from the expanded schedule (our metadata), or null. */
export function pendingIntervalSwitch(sub: Stripe.Subscription): { at: number } | null {
  if (scheduleState(sub) !== "pending") return null;
  const s = sub.schedule;
  if (!s || typeof s === "string" || s.metadata?.pendingInterval !== "month") return null;
  const at = s.phases?.[1]?.start_date ?? subscriptionPeriodEnd(sub);
  return at ? { at } : null;
}
