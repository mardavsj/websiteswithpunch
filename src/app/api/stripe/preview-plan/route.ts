import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan, PLANS } from "@/lib/plans";
import {
  packPrice,
  parseInterval,
  planPrice,
  type BillingInterval,
} from "@/lib/billing-interval";
import { planChangeItems, renewalAfterChange } from "@/lib/plan-change";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { daysLeftInBillingPeriod, subscriptionPeriodEnd } from "@/lib/stripe-subscription";
import {
  formatChargeToday,
  formatRecurringFromCents,
  formatShortDate,
} from "@/lib/billing-format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Preview in-place plan change (Pro → Business, or monthly → annual) at ?interval=. */
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
  let interval: BillingInterval = "month";
  try {
    if (req.method === "GET") {
      const params = new URL(req.url).searchParams;
      const t = params.get("planId");
      if (t === "pro" || t === "business") targetPlan = t;
      interval = parseInterval(params.get("interval"));
    } else {
      const body = await req.json();
      if (body?.planId === "pro" || body?.planId === "business") targetPlan = body.planId;
      interval = parseInterval(body?.interval);
    }
  } catch {
    // default business monthly
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

  try {
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    const change = planChangeItems(subscription, currentPlan, targetPlan, interval);
    if (!change.ok) {
      return NextResponse.json({ error: change.error, code: change.code }, { status: change.status });
    }

    const preview = await stripe.invoices.createPreview({
      customer:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id,
      subscription: subscription.id,
      subscription_details: {
        items: change.items,
        proration_behavior: "create_prorations",
      },
    });

    const amountDueToday = preview.amount_due ?? 0;
    const currency = preview.currency || subscription.currency || "usd";
    const renewal = renewalAfterChange(
      subscriptionPeriodEnd(subscription),
      change.intervalChanges,
      interval,
    );
    const nextRenewalIso = renewal ? renewal.toISOString() : null;
    const newRecurringCents =
      (planPrice(targetPlan, interval) + change.keptPacks * packPrice(targetPlan, interval)) * 100;

    return NextResponse.json({
      currentPlan,
      currentPlanName: currentPlan === "free" ? "Free" : PLANS[currentPlan].name,
      currentInterval: change.currentInterval,
      targetPlan,
      targetPlanName: PLANS[targetPlan].name,
      interval,
      samePlan: change.samePlan,
      intervalChanges: change.intervalChanges,
      keptPacks: change.keptPacks,
      hadPacks: change.droppedPacks,
      amountDueToday,
      amountDueTodayFormatted: formatChargeToday(amountDueToday, currency),
      daysLeftInPeriod: daysLeftInBillingPeriod(subscription),
      nextRenewal: nextRenewalIso,
      nextRenewalFormatted: formatShortDate(nextRenewalIso),
      newRecurringMonthlyCents: newRecurringCents,
      newRecurringMonthlyFormatted: formatRecurringFromCents(newRecurringCents, currency, interval),
      currency,
    });
  } catch (err) {
    console.error("preview-plan error", err);
    return NextResponse.json({ error: "Could not load upgrade preview." }, { status: 500 });
  }
}
