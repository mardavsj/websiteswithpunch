/** Route guards for a pending annual → monthly switch (see interval-schedule.ts). */
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { scheduleId, scheduleState } from "./interval-schedule";

export const SWITCH_PENDING_ERROR =
  "A switch to monthly billing is scheduled for your renewal date. Cancel that switch in Your plan first, then try again.";

/** For previews: block while a switch is pending (read-only). */
export function pendingSwitchResponse(sub: Stripe.Subscription) {
  return scheduleState(sub) === "pending"
    ? NextResponse.json({ error: SWITCH_PENDING_ERROR, code: "SWITCH_PENDING" }, { status: 409 })
    : null;
}

/**
 * For changes: block while a switch is pending; release a finished (stale) schedule so the
 * change isn't overwritten by the schedule's last phase.
 */
export async function ensureNoPendingSwitch(stripe: Stripe, sub: Stripe.Subscription) {
  const blocked = pendingSwitchResponse(sub);
  if (blocked) return blocked;
  const id = scheduleId(sub);
  if (id) await stripe.subscriptionSchedules.release(id);
  return null;
}

/** Cancel overrides a pending switch: release any schedule (subscription stays as is). */
export async function releaseSchedule(stripe: Stripe, sub: Stripe.Subscription) {
  const id = scheduleId(sub);
  if (id) await stripe.subscriptionSchedules.release(id);
}
