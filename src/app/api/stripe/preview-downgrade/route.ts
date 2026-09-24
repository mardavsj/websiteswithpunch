import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan, getEffectiveSiteLimit, PLANS } from "@/lib/plans";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { subscriptionPeriodEnd } from "@/lib/stripe-subscription";
import { formatMonthlyFromCents, formatShortDate } from "@/lib/billing-format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  }
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Billing unavailable" }, { status: 503 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { _count: { select: { sites: true } } },
  });
  if (!user?.stripeSubscriptionId) {
    return NextResponse.json({ error: "No active subscription." }, { status: 400 });
  }
  const plan = getEffectivePlan(user.plan, user.stripeStatus);
  if (plan !== "business") {
    return NextResponse.json({ error: "Not on Business." }, { status: 400 });
  }

  const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
  const end = subscriptionPeriodEnd(subscription);
  const renew = end ? new Date(end * 1000) : null;
  const activeCount = await prisma.site.count({
    where: { userId: user.id, locked: false },
  });
  const newLimit = getEffectiveSiteLimit("pro", 0);
  const keepLimit = getEffectiveSiteLimit("business", user.sitePackCount);

  return NextResponse.json({
    action: "downgrade",
    amountDueToday: 0,
    amountDueTodayFormatted: "$0.00",
    nextRenewal: renew?.toISOString() ?? null,
    nextRenewalFormatted: formatShortDate(renew),
    keepPlanUntil: "Business",
    keepSiteLimitUntilRenewal: keepLimit,
    newPlan: "pro",
    newPlanName: PLANS.pro.name,
    newSiteLimitFromRenewal: newLimit,
    newRecurringMonthlyFormatted: formatMonthlyFromCents(PLANS.pro.price * 100),
    activeCount,
    needsKeepPicker: activeCount > newLimit,
    maxKeep: newLimit,
  });
}
