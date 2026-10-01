import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canBuySitePack,
  getEffectivePlan,
  getEffectiveSiteLimit,
  getPackConfig,
  PLANS,
  type PackPlanId,
} from "@/lib/plans";
import { missingPriceMessage, stripePriceIdForPack } from "@/lib/stripe-prices";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { pendingSwitchResponse } from "@/lib/schedule-guard";
import {
  buildRecurringBreakdown,
  daysLeftInBillingPeriod,
  findPackItem,
  findPlanItem,
  monthlyTotalCentsFromItems,
  priceUnitAmountCents,
  subscriptionInterval,
  subscriptionPeriodEnd,
} from "@/lib/stripe-subscription";
import {
  formatChargeToday,
  formatRecurringFromCents,
  formatShortDate,
} from "@/lib/billing-format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Action = "add" | "remove";

async function preview(action: Action) {
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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { _count: { select: { sites: true } } },
  });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = getEffectivePlan(user.plan, user.stripeStatus);
  if (plan !== "pro" && plan !== "business") {
    return NextResponse.json(
      { error: "Site packs are available on Pro and Business plans only.", code: "NO_SUBSCRIPTION" },
      { status: 403 },
    );
  }

  if (
    !user.stripeSubscriptionId ||
    (user.stripeStatus !== "active" && user.stripeStatus !== "trialing")
  ) {
    return NextResponse.json(
      { error: "An active subscription is required.", code: "NO_SUBSCRIPTION" },
      { status: 403 },
    );
  }

  const packPlan = plan as PackPlanId;
  const config = getPackConfig(packPlan)!;
  const paidPacks = user.sitePackCount ?? 0;
  const hasPendingRemoval =
    user.pendingSitePackCount != null &&
    user.pendingPackChangeAt != null &&
    user.pendingSitePackCount < paidPacks;

  try {
    const subscription = await stripe.subscriptions.retrieve(
      user.stripeSubscriptionId,
    );
    const blocked = pendingSwitchResponse(subscription);
    if (blocked) return blocked;
    // Packs bill on the subscription's interval (annual plan → annual pack price).
    const interval = subscriptionInterval(subscription);
    const existingPack = findPackItem(subscription);
    const stripeQty = existingPack?.quantity ?? 0;
    const planCents = priceUnitAmountCents(findPlanItem(subscription)?.price);
    const packUnit = priceUnitAmountCents(existingPack?.price);
    const currency = subscription.currency || "usd";
    const periodEndSec = subscriptionPeriodEnd(subscription);
    const nextRenewalIso = periodEndSec
      ? new Date(periodEndSec * 1000).toISOString()
      : null;
    const common = {
      interval,
      sitesPerPack: config.sitesPerPack,
      plan: packPlan,
      planName: PLANS[packPlan].name,
      siteCount: user._count.sites,
      nextRenewal: nextRenewalIso,
      nextRenewalFormatted: formatShortDate(nextRenewalIso),
      daysLeftInPeriod: daysLeftInBillingPeriod(subscription),
      currency,
      currentPackCount: paidPacks,
    };
    /** Recurring total + plain breakdown for a pack count, on this interval. */
    const recurring = (packCount: number) => {
      const cents = monthlyTotalCentsFromItems(packPlan, packCount, planCents, packUnit, interval);
      return {
        newRecurringMonthlyCents: cents,
        newRecurringMonthlyFormatted: formatRecurringFromCents(cents, currency, interval),
        recurringBreakdown: buildRecurringBreakdown({
          plan: packPlan,
          packCount,
          planUnitCents: planCents,
          packUnitCents: packUnit,
          currency,
          interval,
        }),
      };
    };

    if (action === "remove") {
      if (paidPacks <= 0 && stripeQty <= 0) {
        return NextResponse.json({ error: "You have no site packs to remove." }, { status: 400 });
      }
      const nextPending = Math.max(0, (hasPendingRemoval ? user.pendingSitePackCount! : paidPacks) - 1);
      return NextResponse.json({
        action: "remove",
        ...common,
        keepSiteLimitUntilRenewal: getEffectiveSiteLimit(packPlan, paidPacks),
        newSiteLimitFromRenewal: getEffectiveSiteLimit(packPlan, nextPending),
        amountDueToday: 0,
        amountDueTodayFormatted: formatChargeToday(0, currency),
        ...recurring(nextPending),
        nextPackCount: nextPending,
      });
    }

    const isUndo = hasPendingRemoval && stripeQty < paidPacks;

    if (!isUndo && !canBuySitePack(packPlan, paidPacks)) {
      return NextResponse.json(
        { error: "Pack limit reached.", code: "PACK_LIMIT", maxPacks: config.maxPacks },
        { status: 403 },
      );
    }

    const priceId = stripePriceIdForPack(packPlan, interval);
    if (!priceId && !existingPack) {
      return NextResponse.json(
        { error: missingPriceMessage("pack", packPlan, interval), code: "PRICE_MISSING" },
        { status: 503 },
      );
    }

    let amountDueToday = 0;
    if (!isUndo) {
      const items: Stripe.InvoiceCreatePreviewParams.SubscriptionDetails.Item[] =
        existingPack
          ? [{ id: existingPack.id, quantity: stripeQty + 1 }]
          : [{ price: priceId!, quantity: 1 }];

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
      amountDueToday = preview.amount_due ?? 0;
    }

    const recurringPacks = isUndo ? paidPacks : paidPacks + 1;
    return NextResponse.json({
      action: "add",
      isUndo,
      ...common,
      amountDueToday,
      amountDueTodayFormatted: formatChargeToday(amountDueToday, currency),
      ...recurring(recurringPacks),
      nextPackCount: recurringPacks,
      newSiteLimit: getEffectiveSiteLimit(packPlan, recurringPacks),
    });
  } catch (err) {
    console.error("preview-pack error", err);
    return NextResponse.json({ error: "Could not load price preview." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") === "remove" ? "remove" : "add";
  return preview(action);
}

export async function POST(req: Request) {
  let action: Action = "add";
  try {
    const body = await req.json();
    if (body?.action === "remove") action = "remove";
  } catch {
    // default add
  }
  return preview(action);
}
