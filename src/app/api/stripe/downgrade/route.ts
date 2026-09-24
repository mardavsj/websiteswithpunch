import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getEffectivePlan,
  getEffectiveSiteLimit,
  PLANS,
  stripePriceIdForPlan,
} from "@/lib/plans";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import {
  findPackItem,
  findPlanItem,
  subscriptionPeriodEnd,
} from "@/lib/stripe-subscription";
import { setKeepOnDowngrade } from "@/lib/site-limits";
import { formatShortDate } from "@/lib/billing-format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  keepSiteIds: z.array(z.string()).optional(),
});

/**
 * Schedule Business → Pro at renewal:
 * - Swap plan price + remove Business packs with proration_behavior none
 * - Keep Business limit until pendingPlanAt
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
  if (!stripe) return NextResponse.json({ error: "Billing unavailable" }, { status: 503 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.stripeSubscriptionId) {
    return NextResponse.json({ error: "No active subscription." }, { status: 400 });
  }
  const plan = getEffectivePlan(user.plan, user.stripeStatus);
  if (plan !== "business") {
    return NextResponse.json({ error: "Downgrade to Pro is only available from Business." }, { status: 400 });
  }

  const priceId = stripePriceIdForPlan("pro");
  if (!priceId) {
    return NextResponse.json({ error: "Pro price is not configured." }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  const keepSiteIds = parsed.success ? parsed.data.keepSiteIds ?? [] : [];

  const newLimit = getEffectiveSiteLimit("pro", 0);
  const activeCount = await prisma.site.count({
    where: { userId: user.id, locked: false },
  });
  if (activeCount > newLimit) {
    if (keepSiteIds.length !== newLimit) {
      return NextResponse.json(
        {
          error: `Your Pro plan includes ${newLimit} sites. Choose which ones stay active.`,
          code: "KEEP_REQUIRED",
          maxKeep: newLimit,
          activeCount,
        },
        { status: 400 },
      );
    }
    const keep = await setKeepOnDowngrade(user.id, keepSiteIds, newLimit);
    if (!keep.ok) return NextResponse.json(keep, { status: 400 });
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    const planItem = findPlanItem(subscription);
    const packItem = findPackItem(subscription);
    const items: Stripe.SubscriptionUpdateParams.Item[] = [];
    if (planItem) {
      items.push({ id: planItem.id, price: priceId });
    } else {
      items.push({ price: priceId, quantity: 1 });
    }
    if (packItem) {
      items.push({ id: packItem.id, deleted: true });
    }

    const updated = await stripe.subscriptions.update(subscription.id, {
      items,
      proration_behavior: "none",
      metadata: {
        ...subscription.metadata,
        userId: user.id,
        planId: "pro",
        pendingDowngrade: "1",
      },
      cancel_at_period_end: false,
    });

    const end = subscriptionPeriodEnd(updated);
    const pendingPlanAt = end ? new Date(end * 1000) : null;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        pendingPlan: "pro",
        pendingPlanAt,
        cancelAtPeriodEnd: false,
        pendingSitePackCount: null,
        pendingPackChangeAt: null,
        stripeStatus: updated.status,
      },
    });

    return NextResponse.json({
      ok: true,
      pendingPlan: "pro",
      pendingPlanAt: pendingPlanAt?.toISOString() ?? null,
      pendingPlanAtFormatted: formatShortDate(pendingPlanAt),
      keepLimitUntil: getEffectiveSiteLimit("business", user.sitePackCount),
      newLimitFrom: newLimit,
      newMonthly: PLANS.pro.price,
    });
  } catch (err) {
    console.error("downgrade error", err);
    return NextResponse.json({ error: "Could not schedule downgrade." }, { status: 500 });
  }
}
