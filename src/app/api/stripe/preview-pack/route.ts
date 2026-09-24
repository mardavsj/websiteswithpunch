import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canBuySitePack,
  getEffectivePlan,
  getPackConfig,
  stripePriceIdForPack,
  type PackPlanId,
} from "@/lib/plans";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import {
  findPackItem,
  formatStripeAmount,
  monthlyTotalDollars,
  subscriptionPeriodEnd,
} from "@/lib/stripe-subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function previewPack() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Billing is not configured." },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Billing unavailable" }, { status: 503 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = getEffectivePlan(user.plan, user.stripeStatus);
  if (plan !== "pro" && plan !== "business") {
    return NextResponse.json(
      {
        error: "Site packs are available on Pro and Business plans only.",
        code: "NO_SUBSCRIPTION",
      },
      { status: 403 },
    );
  }

  if (
    !user.stripeSubscriptionId ||
    (user.stripeStatus !== "active" && user.stripeStatus !== "trialing")
  ) {
    return NextResponse.json(
      {
        error: "An active subscription is required.",
        code: "NO_SUBSCRIPTION",
      },
      { status: 403 },
    );
  }

  const packPlan = plan as PackPlanId;
  const config = getPackConfig(packPlan)!;
  if (!canBuySitePack(packPlan, user.sitePackCount)) {
    return NextResponse.json(
      {
        error: "Pack limit reached.",
        code: "PACK_LIMIT",
        maxPacks: config.maxPacks,
      },
      { status: 403 },
    );
  }

  const priceId = stripePriceIdForPack(packPlan);
  if (!priceId) {
    return NextResponse.json(
      { error: "Pack price is not configured." },
      { status: 503 },
    );
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(
      user.stripeSubscriptionId,
    );

    const existingPack = findPackItem(subscription);
    const currentQty = existingPack?.quantity ?? 0;
    const nextQty = currentQty + 1;

    const items: Stripe.InvoiceCreatePreviewParams.SubscriptionDetails.Item[] =
      existingPack
        ? [{ id: existingPack.id, quantity: nextQty }]
        : [{ price: priceId, quantity: 1 }];

    // stripe@22+: invoices.createPreview (older SDKs used retrieveUpcoming)
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
    const currency = preview.currency || "usd";
    const periodEndSec =
      subscriptionPeriodEnd(subscription) ?? preview.period_end ?? null;
    const nextRenewalIso = periodEndSec
      ? new Date(periodEndSec * 1000).toISOString()
      : null;

    const newMonthly = monthlyTotalDollars(plan, nextQty);

    return NextResponse.json({
      sitesPerPack: config.sitesPerPack,
      packPricePerMonth: config.pricePerMonth,
      amountDueToday,
      amountDueTodayFormatted: formatStripeAmount(amountDueToday, currency),
      newRecurringMonthly: newMonthly,
      newRecurringMonthlyFormatted: formatStripeAmount(
        Math.round(newMonthly * 100),
        currency,
      ),
      nextRenewal: nextRenewalIso,
      currency,
      currentPackCount: currentQty,
      nextPackCount: nextQty,
      plan,
    });
  } catch (err) {
    console.error("preview-pack error", err);
    return NextResponse.json(
      { error: "Could not preview pack charge." },
      { status: 500 },
    );
  }
}

export async function GET() {
  return previewPack();
}

export async function POST() {
  return previewPack();
}
