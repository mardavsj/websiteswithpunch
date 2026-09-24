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
  derivePlanAndPacks,
  findPackItem,
} from "@/lib/stripe-subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Remove one site pack from the existing subscription.
 * No proration / no refund — bill drops from the next renewal.
 * sitePackCount (and site limit) drops immediately.
 */
export async function POST() {
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
  const currentPacks = user.sitePackCount ?? 0;
  if (currentPacks <= 0) {
    return NextResponse.json(
      { error: "You have no site packs to remove." },
      { status: 400 },
    );
  }

  const newPackCount = currentPacks - 1;
  const newLimit = getEffectiveSiteLimit(packPlan, newPackCount);
  const siteCount = user._count.sites;
  if (siteCount > newLimit) {
    return NextResponse.json(
      {
        error: `You have ${siteCount} sites but removing a pack lowers your limit to ${newLimit}. Remove ${siteCount - newLimit} site${siteCount - newLimit === 1 ? "" : "s"} first.`,
        code: "SITES_EXCEED_LIMIT",
        siteCount,
        newLimit,
      },
      { status: 409 },
    );
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(
      user.stripeSubscriptionId,
    );
    const packItem = findPackItem(subscription);
    if (!packItem) {
      // Stripe has no pack item — sync local count down anyway
      await prisma.user.update({
        where: { id: user.id },
        data: { sitePackCount: 0 },
      });
      return NextResponse.json({ ok: true, sitePackCount: 0 });
    }

    const qty = packItem.quantity ?? 0;
    const items: Stripe.SubscriptionUpdateParams.Item[] =
      qty <= 1
        ? [{ id: packItem.id, deleted: true }]
        : [{ id: packItem.id, quantity: qty - 1 }];

    const updated = await stripe.subscriptions.update(subscription.id, {
      items,
      proration_behavior: "none",
    });

    const derived = derivePlanAndPacks(updated);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        sitePackCount: derived.sitePackCount,
        stripeStatus: updated.status,
      },
    });

    return NextResponse.json({
      ok: true,
      sitePackCount: derived.sitePackCount,
      sitesPerPack: config.sitesPerPack,
      message:
        "Removing a pack lowers your limit now and your bill from the next renewal. No refund for the current month.",
    });
  } catch (err) {
    console.error("remove-pack error", err);
    return NextResponse.json(
      { error: "Could not remove site pack." },
      { status: 500 },
    );
  }
}
