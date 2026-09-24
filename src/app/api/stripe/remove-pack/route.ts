import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { z } from "zod";
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
import { setKeepOnDowngrade } from "@/lib/site-limits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  keepSiteIds: z.array(z.string()).optional(),
});

/**
 * Schedule removal of one site pack:
 * - Stripe qty drops now with proration_behavior none (bill drops next renewal)
 * - sitePackCount stays (paid-through) until pendingPackChangeAt
 * - If new limit < active sites, keepSiteIds required
 */
export async function POST(req: Request) {
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

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  const keepSiteIds = parsed.success ? parsed.data.keepSiteIds ?? [] : [];

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
  const newLimitFrom = getEffectiveSiteLimit(packPlan, nextPending);
  const activeCount = await prisma.site.count({
    where: { userId: user.id, locked: false },
  });

  if (activeCount > newLimitFrom) {
    if (keepSiteIds.length !== newLimitFrom) {
      return NextResponse.json(
        {
          error: `Your plan will include ${newLimitFrom} sites. Choose which ones stay active.`,
          code: "KEEP_REQUIRED",
          maxKeep: newLimitFrom,
          activeCount,
        },
        { status: 400 },
      );
    }
    const keep = await setKeepOnDowngrade(user.id, keepSiteIds, newLimitFrom);
    if (!keep.ok) return NextResponse.json(keep, { status: 400 });
  }

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
      newSiteLimitFromRenewal: newLimitFrom,
      activeCount,
    });
  } catch (err) {
    console.error("remove-pack error", err);
    return NextResponse.json({ error: "Could not remove site pack." }, { status: 500 });
  }
}
