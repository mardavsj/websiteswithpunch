import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getEffectivePlan,
  getUserEffectiveSiteLimit,
  PLANS,
  resolvePackCountForLimit,
  SITE_PACKS,
} from "@/lib/plans";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import {
  buildRecurringBreakdown,
  findPackItem,
  findPlanItem,
  monthlyTotalCentsFromItems,
  priceUnitAmountCents,
  subscriptionPeriodEnd,
} from "@/lib/stripe-subscription";
import {
  formatMonthlyFromCents,
  formatShortDate,
} from "@/lib/billing-format";
import {
  applyDuePendingAndEnforce,
  pendingTargetLimit,
  swapCooldownRemaining,
} from "@/lib/site-limits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Next payment date + monthly total for the "Your plan" box. */
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await applyDuePendingAndEnforce(session.user.id);
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = getEffectivePlan(user.plan, user.stripeStatus);
  const resolved = resolvePackCountForLimit({
    sitePackCount: user.sitePackCount,
    pendingSitePackCount: user.pendingSitePackCount,
    pendingPackChangeAt: user.pendingPackChangeAt,
  });

  // Lazily apply expired pending removal
  if (resolved.shouldApplyPending) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        sitePackCount: resolved.packCount,
        pendingSitePackCount: null,
        pendingPackChangeAt: null,
      },
    });
  }

  const packCount = resolved.packCount;
  const siteLimit = getUserEffectiveSiteLimit(
    plan,
    resolved.shouldApplyPending ? resolved.packCount : user.sitePackCount,
    resolved.shouldApplyPending ? null : user.pendingSitePackCount,
    resolved.shouldApplyPending ? null : user.pendingPackChangeAt,
  );

  let nextPaymentDate: string | null = null;
  let nextPaymentDateFormatted: string | null = null;
  let monthlyTotalCents =
    plan === "pro" || plan === "business"
      ? Math.round(
          (PLANS[plan].price +
            (SITE_PACKS[plan as "pro" | "business"]
              ? Math.min(
                  packCount,
                  SITE_PACKS[plan as "pro" | "business"].maxPacks,
                ) * SITE_PACKS[plan as "pro" | "business"].pricePerMonth
              : 0)) *
            100,
        )
      : 0;
  let recurringBreakdown =
    plan === "pro" || plan === "business"
      ? buildRecurringBreakdown({
          plan,
          packCount,
          planUnitCents: null,
          packUnitCents: null,
        })
      : null;
  let currency = "usd";

  if (
    isStripeConfigured() &&
    user.stripeSubscriptionId &&
    (user.stripeStatus === "active" || user.stripeStatus === "trialing")
  ) {
    try {
      const stripe = getStripe();
      if (stripe) {
        const subscription = await stripe.subscriptions.retrieve(
          user.stripeSubscriptionId,
        );
        const end = subscriptionPeriodEnd(subscription);
        if (end) {
          nextPaymentDate = new Date(end * 1000).toISOString();
          nextPaymentDateFormatted = formatShortDate(nextPaymentDate);
        }
        const planItem = findPlanItem(subscription);
        const packItem = findPackItem(subscription);
        const planCents = priceUnitAmountCents(planItem?.price);
        const packCents = priceUnitAmountCents(packItem?.price);
        currency = subscription.currency || "usd";
        // Next payment reflects Stripe qty (already lowered when a removal is pending).
        const stripePackQty = packItem?.quantity ?? 0;
        monthlyTotalCents = monthlyTotalCentsFromItems(
          plan === "pro" || plan === "business" ? plan : "pro",
          stripePackQty,
          planCents,
          packCents,
        );
        recurringBreakdown = buildRecurringBreakdown({
          plan: plan === "pro" || plan === "business" ? plan : "pro",
          packCount: stripePackQty,
          planUnitCents: planCents,
          packUnitCents: packCents,
          currency,
        });
      }
    } catch (err) {
      console.error("billing-summary stripe error", err);
    }
  }

  const hasPendingRemoval =
    !resolved.shouldApplyPending &&
    user.pendingSitePackCount != null &&
    user.pendingPackChangeAt != null &&
    user.pendingSitePackCount < (user.sitePackCount ?? 0);

  const pendingSites =
    hasPendingRemoval && (plan === "pro" || plan === "business")
      ? ((user.sitePackCount ?? 0) - (user.pendingSitePackCount ?? 0)) *
        SITE_PACKS[plan].sitesPerPack
      : 0;

  return NextResponse.json({
    plan,
    planName: PLANS[plan].name,
    sitePackCount: packCount,
    siteLimit,
    monthlyTotalCents,
    monthlyTotalFormatted: formatMonthlyFromCents(monthlyTotalCents, currency),
    recurringBreakdown,
    nextPaymentDate,
    nextPaymentDateFormatted,
    currency,
    hasPendingRemoval,
    pendingSitePackCount: hasPendingRemoval ? user.pendingSitePackCount : null,
    pendingPackChangeAt: hasPendingRemoval
      ? user.pendingPackChangeAt?.toISOString() ?? null
      : null,
    pendingPackChangeAtFormatted: hasPendingRemoval
      ? formatShortDate(user.pendingPackChangeAt)
      : null,
    pendingSitesToRemove: pendingSites,
    cancelAtPeriodEnd: user.cancelAtPeriodEnd,
    pendingPlan: user.pendingPlan,
    pendingPlanAt: user.pendingPlanAt?.toISOString() ?? null,
    pendingPlanAtFormatted: user.pendingPlanAt
      ? formatShortDate(user.pendingPlanAt)
      : null,
    pendingTargetLimit: pendingTargetLimit(user),
    showDefaultLockNotice: user.showDefaultLockNotice,
    stripeStatus: user.stripeStatus,
    paymentFailed: user.stripeStatus === "past_due",
    swapCooldownMs: swapCooldownRemaining(user.lastSiteSwapAt),
    lastSiteSwapAt: user.lastSiteSwapAt?.toISOString() ?? null,
  });
}
