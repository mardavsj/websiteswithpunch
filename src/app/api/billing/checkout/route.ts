import { NextResponse } from "next/server";
import type DodoPayments from "dodopayments";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/plans";
import { intervalLabel, parseInterval, type BillingInterval, type PaidPlanId } from "@/lib/billing-interval";
import { appUrl, dodoUserMessage } from "@/lib/dodo";
import { missingCatalogMessage, productIdFor } from "@/lib/dodo-products";
import { isPaidStatus, subscriptionState } from "@/lib/dodo-subscription";
import { applyChange, changeBody } from "@/lib/dodo-change";
import { blockIfScheduled, fail, loadUser, ON_HOLD_ERROR } from "@/lib/billing-route";
import { isVerified } from "@/lib/email-verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Free → paid: Dodo hosted checkout session (the webhook / return sync turns the plan on).
 * Existing subscriber (Pro → Business, or monthly → annual): Change Plan in place, charged
 * now with proration. Business → Pro and annual → monthly are renewal-date bookings elsewhere.
 */
export async function POST(req: Request) {
  const loaded = await loadUser({ label: "checkout", rateKey: "checkout" });
  if (loaded instanceof NextResponse) return loaded;
  const { user, dodo } = loaded;
  if (!isVerified(user)) return fail(403, "Verify your email to continue.", "EMAIL_UNVERIFIED");

  const body = await req.json().catch(() => ({}));
  const planId: PaidPlanId = body?.planId === "business" ? "business" : "pro";
  const interval = parseInterval(body?.interval);

  if (user.dodoStatus === "on_hold") return fail(402, ON_HOLD_ERROR, "PAYMENT_FAILED");
  try {
    if (user.dodoSubscriptionId && isPaidStatus(user.dodoStatus)) {
      return await changeInPlace(dodo, user, planId, interval);
    }
    return await newCheckout(dodo, user, planId, interval);
  } catch (err) {
    console.error("billing checkout error", err);
    return fail(502, dodoUserMessage(err, "Could not start checkout. Please try again."), "PAYMENT_FAILED");
  }
}

async function newCheckout(dodo: DodoPayments, user: User, planId: PaidPlanId, interval: BillingInterval) {
  const productId = productIdFor(planId, interval);
  if (!productId) return fail(503, missingCatalogMessage("plan", planId, interval), "PRICE_MISSING");

  let customerId = user.dodoCustomerId;
  if (!customerId) {
    const customer = await dodo.customers.create({
      email: user.email,
      name: user.name?.trim() || user.email,
      metadata: { userId: user.id },
    });
    customerId = customer.customer_id;
    await prisma.user.update({ where: { id: user.id }, data: { dodoCustomerId: customerId } });
  }

  const session = await dodo.checkoutSessions.create({
    product_cart: [{ product_id: productId, quantity: 1 }],
    customer: { customer_id: customerId },
    // Dodo appends subscription_id and status; the dashboard syncs from them right away.
    return_url: `${appUrl()}/dashboard?checkout=done`,
    cancel_url: `${appUrl()}/dashboard?checkout=canceled`,
    metadata: { userId: user.id, planId, interval },
  });
  if (!session.checkout_url) return fail(502, "Could not start checkout. Please try again.");
  return NextResponse.json({ url: session.checkout_url });
}

async function changeInPlace(dodo: DodoPayments, user: User, planId: PaidPlanId, interval: BillingInterval) {
  const sub = await dodo.subscriptions.retrieve(user.dodoSubscriptionId!);
  const st = subscriptionState(sub);
  if (!st.plan || !isPaidStatus(st.status)) {
    return fail(409, "Your subscription isn't active. Refresh the page and try again.");
  }
  if (st.plan === planId && st.interval === interval) {
    return fail(400, `You're already on ${PLANS[planId].name} with ${intervalLabel(interval).toLowerCase()} billing.`);
  }
  if (st.plan === "business" && planId === "pro") {
    return fail(400, "To switch to Pro, use Switch to Pro in Your plan (takes effect at renewal).", "USE_DOWNGRADE");
  }
  if (st.interval === "year" && interval === "month") {
    return fail(400, "You're billed yearly, so plan changes stay on annual billing. Choose Annual.", "ANNUAL_ONLY");
  }
  const blocked = blockIfScheduled(st, ["packs"]);
  if (blocked) return blocked;

  const samePlan = st.plan === planId;
  // Interval switch keeps packs (at the booked lower count if a removal is pending);
  // Business includes 50 sites, so Pro packs don't carry over.
  const packs = samePlan ? (st.scheduled ? st.scheduled.packs : st.packs) : 0;
  const built = changeBody({ plan: planId, interval, packs }, "now", st);
  if (!built.ok) return fail(503, built.error, "PRICE_MISSING");

  // Upgrading undoes a booked cancellation, as before.
  if (st.cancelAtPeriodEnd) {
    await dodo.subscriptions.update(sub.subscription_id, { cancel_at_next_billing_date: false });
  }
  const { applied } = await applyChange(
    dodo,
    sub.subscription_id,
    user.id,
    built.body,
    (f) => f.plan === planId && f.interval === interval,
  );
  return NextResponse.json({ ok: true, pending: !applied, plan: planId, interval, sitePackCount: packs });
}
