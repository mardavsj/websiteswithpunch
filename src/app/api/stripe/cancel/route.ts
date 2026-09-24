import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan, PLANS } from "@/lib/plans";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { subscriptionPeriodEnd } from "@/lib/stripe-subscription";
import { setKeepOnDowngrade } from "@/lib/site-limits";
import { formatShortDate } from "@/lib/billing-format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  keepSiteIds: z.array(z.string()).optional(),
});

/**
 * Schedule cancel at period end. User keeps plan until then.
 * Body may include keepSiteIds when active sites > Free limit (1).
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
  if (plan === "free") {
    return NextResponse.json({ error: "You're already on Free." }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  const keepSiteIds = parsed.success ? parsed.data.keepSiteIds ?? [] : [];

  const activeCount = await prisma.site.count({
    where: { userId: user.id, locked: false },
  });
  const freeLimit = PLANS.free.siteLimit;
  if (activeCount > freeLimit) {
    if (keepSiteIds.length !== freeLimit) {
      return NextResponse.json(
        {
          error: `Your Free plan includes ${freeLimit} site. Choose which one stays active.`,
          code: "KEEP_REQUIRED",
          maxKeep: freeLimit,
          activeCount,
        },
        { status: 400 },
      );
    }
    const keep = await setKeepOnDowngrade(user.id, keepSiteIds, freeLimit);
    if (!keep.ok) return NextResponse.json(keep, { status: 400 });
  }

  try {
    const updated = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    const end = subscriptionPeriodEnd(updated);
    const pendingPlanAt = end ? new Date(end * 1000) : null;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        cancelAtPeriodEnd: true,
        pendingPlan: "free",
        pendingPlanAt,
        pendingSitePackCount: null,
        pendingPackChangeAt: null,
      },
    });

    return NextResponse.json({
      ok: true,
      pendingPlan: "free",
      pendingPlanAt: pendingPlanAt?.toISOString() ?? null,
      pendingPlanAtFormatted: formatShortDate(pendingPlanAt),
      keepLimit: freeLimit,
    });
  } catch (err) {
    console.error("cancel error", err);
    return NextResponse.json({ error: "Could not schedule cancellation." }, { status: 500 });
  }
}
