import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getEffectivePlan,
  PLANS,
  stripePriceIdForPlan,
} from "@/lib/plans";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import {
  daysLeftInBillingPeriod,
  findPackItem,
  findPlanItem,
  subscriptionPeriodEnd,
} from "@/lib/stripe-subscription";
import {
  formatChargeToday,
  formatMonthlyFromCents,
  formatShortDate,
} from "@/lib/billing-format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Preview in-place plan change (e.g. Pro → Business). */
export async function GET(req: Request) {
  return previewPlan(req);
}

export async function POST(req: Request) {
  return previewPlan(req);
}

async function previewPlan(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Billing unavailable" }, { status: 503 });
  }

  let targetPlan: "pro" | "business" = "business";
  try {
    if (req.method === "GET") {
      const t = new URL(req.url).searchParams.get("planId");
      if (t === "pro" || t === "business") targetPlan = t;
    } else {
      const body = await req.json();
      if (body?.planId === "pro" || body?.planId === "business") targetPlan = body.planId;
    }
  } catch {
    // default business
  }

  const priceId = stripePriceIdForPlan(targetPlan);
  if (!priceId) {
    return NextResponse.json({ error: "Plan price is not configured." }, { status: 503 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentPlan = getEffectivePlan(user.plan, user.stripeStatus);
  if (
    !user.stripeSubscriptionId ||
    (user.stripeStatus !== "active" && user.stripeStatus !== "trialing")
  ) {
    return NextResponse.json(
      { error: "No active plan to change.", code: "NO_SUBSCRIPTION" },
      { status: 403 },
    );
  }

  if (currentPlan === targetPlan) {
    return NextResponse.json({ error: "You are already on this plan." }, { status: 400 });
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    const planItem = findPlanItem(subscription);
    const packItem = findPackItem(subscription);
    const hadPacks =
      (user.sitePackCount ?? 0) > 0 ||
      (packItem?.quantity ?? 0) > 0 ||
      (user.pendingSitePackCount != null && user.pendingSitePackCount >= 0);

    const items: Stripe.InvoiceCreatePreviewParams.SubscriptionDetails.Item[] = [];
    if (planItem) {
      items.push({ id: planItem.id, price: priceId });
    } else {
      items.push({ price: priceId, quantity: 1 });
    }
    if (packItem) {
      items.push({ id: packItem.id, deleted: true });
    }

    const preview = await stripe.invoices.createPreview({
      customer:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id,
      subscription: subscription.id,
      subscription_details: {
        items,
        proration_behavior: "create_prorations",
      },
    });

    const amountDueToday = preview.amount_due ?? 0;
    const currency = preview.currency || subscription.currency || "usd";
    const periodEndSec = subscriptionPeriodEnd(subscription);
    const nextRenewalIso = periodEndSec
      ? new Date(periodEndSec * 1000).toISOString()
      : null;
    const targetPrice = PLANS[targetPlan].price * 100;
    const newMonthlyCents = targetPrice;

    return NextResponse.json({
      currentPlan,
      currentPlanName: currentPlan === "free" ? "Free" : PLANS[currentPlan].name,
      targetPlan,
      targetPlanName: PLANS[targetPlan].name,
      hadPacks: Boolean(hadPacks && (user.sitePackCount ?? 0) > 0),
      amountDueToday,
      amountDueTodayFormatted: formatChargeToday(amountDueToday, currency),
      daysLeftInPeriod: daysLeftInBillingPeriod(subscription),
      nextRenewal: nextRenewalIso,
      nextRenewalFormatted: formatShortDate(nextRenewalIso),
      newRecurringMonthlyCents: newMonthlyCents,
      newRecurringMonthlyFormatted: formatMonthlyFromCents(newMonthlyCents, currency),
      currency,
    });
  } catch (err) {
    console.error("preview-plan error", err);
    return NextResponse.json({ error: "Could not load upgrade preview." }, { status: 500 });
  }
}
