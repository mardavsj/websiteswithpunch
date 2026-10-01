import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan } from "@/lib/plans";
import { parseInterval, type BillingInterval } from "@/lib/billing-interval";
import { missingPriceMessage, stripePriceIdForPlan } from "@/lib/stripe-prices";
import { planChangeItems } from "@/lib/plan-change";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import {
  derivePlanAndPacks,
  hostedInvoiceUrlFromSubscription,
  subscriptionNeedsPaymentAction,
} from "@/lib/stripe-subscription";
import { enforceSiteLimit } from "@/lib/site-limits";

/**
 * First-time purchase → Stripe Checkout Session at the chosen interval (monthly / annual).
 * Existing subscriber upgrading (Pro → Business, or monthly → annual) → update in place via
 * planChangeItems (plan change drops packs; interval switch moves packs to the matching price).
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Billing is not configured. Set STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, and STRIPE_PRICE_ID_PRO (or STRIPE_PRICE_ID).",
      },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Billing unavailable" }, { status: 503 });
  }

  let planId: "pro" | "business" = "pro";
  let interval: BillingInterval = "month";
  try {
    const body = await req.json();
    if (body?.planId === "business" || body?.planId === "pro") {
      planId = body.planId;
    }
    interval = parseInterval(body?.interval);
  } catch {
    // empty body → default Pro monthly
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { _count: { select: { sites: true } } },
  });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentPlan = getEffectivePlan(user.plan, user.stripeStatus);
  const hasActiveSub =
    Boolean(user.stripeSubscriptionId) &&
    (user.stripeStatus === "active" || user.stripeStatus === "trialing");

  // In-place plan change for existing subscribers (avoids a second subscription)
  if (hasActiveSub && user.stripeSubscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(
        user.stripeSubscriptionId,
        { expand: ["latest_invoice.payment_intent"] },
      );

      const change = planChangeItems(subscription, currentPlan, planId, interval);
      if (!change.ok) {
        return NextResponse.json(
          { error: change.error, code: change.code },
          { status: change.status },
        );
      }
      const { items, samePlan } = change;

      const updated = await stripe.subscriptions.update(subscription.id, {
        items,
        proration_behavior: "always_invoice",
        payment_behavior: "pending_if_incomplete",
        cancel_at_period_end: false,
        metadata: {
          ...subscription.metadata,
          userId: user.id,
          planId,
          interval,
        },
        expand: ["latest_invoice.payment_intent"],
      });

      if (subscriptionNeedsPaymentAction(updated)) {
        const hostedUrl = hostedInvoiceUrlFromSubscription(updated);
        if (hostedUrl) {
          return NextResponse.json({
            requiresAction: true,
            hostedInvoiceUrl: hostedUrl,
            code: "PAYMENT_REQUIRED",
          });
        }
        return NextResponse.json(
          {
            error:
              "Payment requires confirmation. Complete it from Manage billing, then refresh.",
            code: "PAYMENT_FAILED",
          },
          { status: 402 },
        );
      }

      const derived = derivePlanAndPacks(updated);
      // Prefer requested planId; packs cleared on plan switch, kept on an interval switch
      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: planId,
          ...(samePlan
            ? {}
            : { sitePackCount: 0, pendingSitePackCount: null, pendingPackChangeAt: null }),
          pendingPlan: null,
          pendingPlanAt: null,
          cancelAtPeriodEnd: false,
          stripeStatus: updated.status,
          stripeSubscriptionId: updated.id,
          stripeCustomerId:
            typeof updated.customer === "string"
              ? updated.customer
              : updated.customer.id,
        },
      });

      await enforceSiteLimit(user.id);

      return NextResponse.json({
        ok: true,
        plan: planId,
        interval,
        sitePackCount: derived.sitePackCount,
      });
    } catch (err) {
      console.error("in-place plan change error", err);
      const stripeErr = err as { message?: string };
      return NextResponse.json(
        {
          error: stripeErr.message || "Could not change plan.",
          code: "PAYMENT_FAILED",
        },
        { status: 402 },
      );
    }
  }

  // First-time / no active subscription → Checkout Session
  const priceId = stripePriceIdForPlan(planId, interval);
  if (!priceId) {
    return NextResponse.json(
      { error: missingPriceMessage("plan", planId, interval), code: "PRICE_MISSING" },
      { status: 503 },
    );
  }

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard?upgraded=1`,
    cancel_url: `${baseUrl}/dashboard?canceled=1`,
    metadata: { userId: user.id, planId, interval },
    subscription_data: { metadata: { userId: user.id, planId, interval } },
  });

  return NextResponse.json({ url: checkout.url });
}
