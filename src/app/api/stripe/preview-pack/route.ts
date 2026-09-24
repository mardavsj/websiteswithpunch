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
  stripePriceIdForPack,
  type PackPlanId,
} from "@/lib/plans";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import {
  buildRecurringBreakdown,
  daysLeftInBillingPeriod,
  findPackItem,
  findPlanItem,
  monthlyTotalCentsFromItems,
  priceUnitAmountCents,
  subscriptionPeriodEnd,
} from "@/lib/stripe-subscription";
import {
  formatChargeToday,
  formatMonthlyFromCents,
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
    const existingPack = findPackItem(subscription);
    const stripeQty = existingPack?.quantity ?? 0;
    const planItem = findPlanItem(subscription);
    const planCents = priceUnitAmountCents(planItem?.price);
    const packCents = priceUnitAmountCents(existingPack?.price) ?? (
      config.pricePerMonth * 100
    );
    const currency = subscription.currency || "usd";
    const periodEndSec = subscriptionPeriodEnd(subscription);
    const nextRenewalIso = periodEndSec
      ? new Date(periodEndSec * 1000).toISOString()
      : null;
    const nextRenewalFormatted = formatShortDate(nextRenewalIso);
    const daysLeft = daysLeftInBillingPeriod(subscription);
    const siteCount = user._count.sites;

    if (action === "remove") {
      if (paidPacks <= 0 && stripeQty <= 0) {
        return NextResponse.json({ error: "You have no site packs to remove." }, { status: 400 });
      }
      const nextPending = Math.max(0, (hasPendingRemoval ? user.pendingSitePackCount! : paidPacks) - 1);
      const newMonthlyCents = monthlyTotalCentsFromItems(
        packPlan,
        nextPending,
        planCents,
        packCents === config.pricePerMonth * 100
          ? priceUnitAmountCents(existingPack?.price)
          : packCents,
      );
      const packUnit = priceUnitAmountCents(existingPack?.price);
      const breakdown = buildRecurringBreakdown({
        plan: packPlan,
        packCount: nextPending,
        planUnitCents: planCents,
        packUnitCents: packUnit,
        currency,
      });
      const keepSitesUntil = getEffectiveSiteLimit(packPlan, paidPacks);
      const newLimitFrom = getEffectiveSiteLimit(packPlan, nextPending);

      return NextResponse.json({
        action: "remove",
        sitesPerPack: config.sitesPerPack,
        plan: packPlan,
        planName: PLANS[packPlan].name,
        siteCount,
        keepSiteLimitUntilRenewal: keepSitesUntil,
        newSiteLimitFromRenewal: newLimitFrom,
        nextRenewal: nextRenewalIso,
        nextRenewalFormatted,
        daysLeftInPeriod: daysLeft,
        amountDueToday: 0,
        amountDueTodayFormatted: formatChargeToday(0, currency),
        newRecurringMonthlyCents: newMonthlyCents,
        newRecurringMonthlyFormatted: formatMonthlyFromCents(newMonthlyCents, currency),
        recurringBreakdown: breakdown,
        currency,
        currentPackCount: paidPacks,
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

    const priceId = stripePriceIdForPack(packPlan);
    if (!priceId && !existingPack) {
      return NextResponse.json({ error: "Pack price is not configured." }, { status: 503 });
    }

    let amountDueToday = 0;
    if (!isUndo) {
      const nextQty = stripeQty + 1;
      const items: Stripe.InvoiceCreatePreviewParams.SubscriptionDetails.Item[] =
        existingPack
          ? [{ id: existingPack.id, quantity: nextQty }]
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

    const nextPackCount = isUndo
      ? Math.min(paidPacks, stripeQty + 1)
      : paidPacks + 1;
    const recurringPacks = isUndo ? paidPacks : nextPackCount;
    const packUnit = priceUnitAmountCents(existingPack?.price) ?? config.pricePerMonth * 100;
    const newMonthlyCents = monthlyTotalCentsFromItems(
      packPlan,
      recurringPacks,
      planCents,
      packUnit,
    );
    const breakdown = buildRecurringBreakdown({
      plan: packPlan,
      packCount: recurringPacks,
      planUnitCents: planCents,
      packUnitCents: packUnit,
      currency,
    });

    return NextResponse.json({
      action: "add",
      isUndo,
      sitesPerPack: config.sitesPerPack,
      plan: packPlan,
      planName: PLANS[packPlan].name,
      siteCount,
      amountDueToday,
      amountDueTodayFormatted: formatChargeToday(amountDueToday, currency),
      daysLeftInPeriod: daysLeft,
      nextRenewal: nextRenewalIso,
      nextRenewalFormatted,
      newRecurringMonthlyCents: newMonthlyCents,
      newRecurringMonthlyFormatted: formatMonthlyFromCents(newMonthlyCents, currency),
      recurringBreakdown: breakdown,
      currency,
      currentPackCount: paidPacks,
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
