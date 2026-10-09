/**
 * Plan / pack / interval changes on the one Dodo subscription (Change Plan API).
 * - Upgrades and added packs apply now: `prorated_immediately` credits the unused part of the
 *   current cycle and charges the new cycle (Dodo starts a new cycle on the change date).
 *   `prevent_change` keeps the current plan if that charge fails, so nothing is lost.
 * - Downgrades, pack removals and annual → monthly are booked for the renewal date with
 *   `do_not_bill`: nothing is charged, refunded or credited; the renewal bills the new plan.
 * A Dodo subscription holds one booked change, so a new booking replaces the old one.
 */
import type DodoPayments from "dodopayments";
import type { BillingInterval, PaidPlanId } from "./billing-interval";
import { missingCatalogMessage, packAddonIdFor, productIdFor } from "./dodo-products";
import { subscriptionState, type SubscriptionState } from "./dodo-subscription";
import { syncSubscription } from "./dodo-sync";

export type ChangeTarget = { plan: PaidPlanId; interval: BillingInterval; packs: number };
type ChangeBody = DodoPayments.SubscriptionChangePlanParams;

/** Change Plan body for a target, or a config error naming the missing env var. */
export function changeBody(
  target: ChangeTarget,
  when: "now" | "renewal",
  st: SubscriptionState,
): { ok: true; body: ChangeBody } | { ok: false; error: string } {
  const productId = productIdFor(target.plan, target.interval);
  if (!productId) return { ok: false, error: missingCatalogMessage("plan", target.plan, target.interval) };
  const addons: ChangeBody["addons"] = [];
  if (target.packs > 0) {
    const addonId = packAddonIdFor(target.plan, target.interval);
    if (!addonId) return { ok: false, error: missingCatalogMessage("pack", target.plan, target.interval) };
    addons.push({ addon_id: addonId, quantity: target.packs });
  }
  const body: ChangeBody = {
    product_id: productId,
    quantity: 1,
    addons, // always sent: an omitted list would drop existing add-ons
    ...(when === "now"
      ? {
          proration_billing_mode: "prorated_immediately",
          effective_at: "immediately",
          on_payment_failure: "prevent_change",
        }
      : { proration_billing_mode: "do_not_bill", effective_at: "next_billing_date" }),
    ...(st.scheduled ? { cancel_scheduled_change_plan: true } : {}),
  };
  return { ok: true, body };
}

/** Preview body: the same request minus fields the preview route ignores. */
export function previewBody(body: ChangeBody): DodoPayments.SubscriptionPreviewChangePlanParams {
  const { product_id, quantity, addons, proration_billing_mode, effective_at, on_payment_failure } = body;
  return { product_id, quantity, addons, proration_billing_mode, effective_at, on_payment_failure };
}

/**
 * Send the change, re-read the subscription and mirror it. `applied` is false while Dodo is
 * still confirming the charge (usually under two minutes); the webhook finishes the job.
 */
export async function applyChange(
  dodo: DodoPayments,
  subscriptionId: string,
  userId: string,
  body: ChangeBody,
  isApplied: (fresh: SubscriptionState) => boolean,
): Promise<{ applied: boolean; fresh: SubscriptionState }> {
  await dodo.subscriptions.changePlan(subscriptionId, body);
  const fresh = subscriptionState(await resync(dodo, subscriptionId, userId));
  return { applied: isApplied(fresh), fresh };
}

/** Re-read and mirror after a change that has no charge (cancel, resume, bookings). */
export async function resync(dodo: DodoPayments, subscriptionId: string, userId: string) {
  const sub = await dodo.subscriptions.retrieve(subscriptionId);
  await syncSubscription(sub, { userId });
  return sub;
}
