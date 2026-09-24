import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getEffectivePlan,
  getEffectiveSiteLimit,
  getPackConfig,
  type PackPlanId,
} from "@/lib/plans";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import {
  findPackItem,
  subscriptionPeriodEnd,
} from "@/lib/stripe-subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Schedule removal of one site pack:
 * - Stripe qty drops now with proration_behavior none (bill drops next renewal)
 * - sitePackCount stays (paid-through) until pendingPackChangeAt
 * - pendingSitePackCount = new lower target
 */
export async function POST() {
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
      { error: "No paid plan.", code: "NO_SUBSCRIPTION" },
      { status: 403 },
    );
  }

  if (!user.stripeSubscriptionId) {
    return NextResponse.json(
      { error: "No subscription on file.", code: "NO_SUBSCRIPTION" },
      { status: 403 },
    );
  }

  const packPlan = plan as PackPlanId;
  const config = getPackConfig(packPlan)!;
  const paidPacks = user.sitePackCount ?? 0;
  const currentTarget =
    user.pendingSitePackCount != null && user.pendingPackChangeAt
      ? user.pendingSitePackCount
      : paidPacks;

  if (paidPacks <= 0 && currentTarget <= 0) {
    return NextResponse.json({ error: "You have no site packs to remove." }, { status: 400 });
  }

  const nextPending = Math.max(0, currentTarget - 1);

  try {
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    const packItem = findPackItem(subscription);
    const periodEnd = subscriptionPeriodEnd(subscription);
    if (!periodEnd) {
      return NextResponse.json(
        { error: "Could not determine your renewal date. Try again or open Manage billing." },
        { status: 500 },
      );
    }

    if (packItem) {
      const qty = packItem.quantity ?? 0;
      const items: Stripe.SubscriptionUpdateParams.Item[] =
        qty <= 1
          ? [{ id: packItem.id, deleted: true }]
          : [{ id: packItem.id, quantity: qty - 1 }];

      await stripe.subscriptions.update(subscription.id, {
        items,
        proration_behavior: "none",
      });
    }

    // Keep sitePackCount (paid-through). Store lower target as pending.
    const paidThrough = Math.max(paidPacks, currentTarget);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        sitePackCount: paidThrough,
        pendingSitePackCount: nextPending,
        pendingPackChangeAt: new Date(periodEnd * 1000),
      },
    });

    return NextResponse.json({
      ok: true,
      sitePackCount: paidThrough,
      pendingSitePackCount: nextPending,
      pendingPackChangeAt: new Date(periodEnd * 1000).toISOString(),
      sitesPerPack: config.sitesPerPack,
      keepSiteLimit: getEffectiveSiteLimit(packPlan, paidThrough),
      newSiteLimitFromRenewal: getEffectiveSiteLimit(packPlan, nextPending),
      siteCount: user._count.sites,
    });
  } catch (err) {
    console.error("remove-pack error", err);
    return NextResponse.json({ error: "Could not remove site pack." }, { status: 500 });
  }
}
