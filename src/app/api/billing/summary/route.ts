import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan, getUserEffectiveSiteLimit, PLANS, resolvePackCountForLimit, SITE_PACKS, type PlanId } from "@/lib/plans";
import { intervalLabel, type BillingInterval } from "@/lib/billing-interval";
import { getDodo, isDodoConfigured } from "@/lib/dodo";
import { ENDED_STATUSES, isPaidStatus, scheduledKind, subscriptionState } from "@/lib/dodo-subscription";
import { syncSubscription } from "@/lib/dodo-sync";
import { recurringBreakdown, recurringTotalCents } from "@/lib/billing-totals";
import { formatRecurringFromCents, formatShortDate } from "@/lib/billing-format";
import { applyDuePendingAndEnforce, pendingTargetLimit } from "@/lib/site-limits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Next payment date, billing interval + per-interval total for the "Your plan" box. */
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await applyDuePendingAndEnforce(session.user.id);
  let user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Read the live subscription once. If our copy drifted (a missed or failed webhook), mirror
  // it now, so opening Your plan always heals the plan, packs and status.
  const dodo = isDodoConfigured() ? getDodo() : null;
  let live: ReturnType<typeof subscriptionState> | null = null;
  let healed = false;
  if (dodo && user.dodoSubscriptionId && !ENDED_STATUSES.has(user.dodoStatus ?? "")) {
    try {
      const sub = await dodo.subscriptions.retrieve(user.dodoSubscriptionId);
      live = subscriptionState(sub);
      const drifted =
        (live.plan && live.plan !== user.plan) ||
        live.packs !== user.sitePackCount ||
        live.status !== user.dodoStatus ||
        live.cancelAtPeriodEnd !== user.cancelAtPeriodEnd;
      if (drifted) {
        console.warn("[billing summary] healed drift for", user.id, user.plan, "→", live.plan, live.status);
        healed = (await syncSubscription(sub, { userId: user.id })) === "synced";
        user = (await prisma.user.findUnique({ where: { id: user.id } })) ?? user;
      }
    } catch (err) {
      console.error("billing summary dodo error", err);
    }
  }

  const plan = getEffectivePlan(user.plan, user.dodoStatus);
  const { packCount } = resolvePackCountForLimit(user);
  const siteLimit = getUserEffectiveSiteLimit(plan, user.sitePackCount, user.pendingSitePackCount, user.pendingPackChangeAt);

  let interval: BillingInterval = "month";
  let nextPaymentDate: string | null = null;
  // What renews next: the booked change (plan, packs, interval) when there is one.
  let next: { plan: PlanId; packs: number; interval: BillingInterval } | null = null;
  let pendingMonthly: { atFormatted: string | null; priceFormatted: string } | null = null;

  if (live && isPaidStatus(user.dodoStatus) && plan !== "free") {
    {
      const st = live;
      interval = st.interval;
      nextPaymentDate = st.periodEnd?.toISOString() ?? null;
      if (st.scheduled) next = { plan: st.scheduled.plan, packs: st.scheduled.packs, interval: st.scheduled.interval };
      if (st.scheduled && scheduledKind(st) === "interval") {
        const cents = recurringTotalCents(plan, st.scheduled.packs, "month");
        pendingMonthly = {
          atFormatted: formatShortDate(st.scheduled.at),
          priceFormatted: formatRecurringFromCents(cents, "usd", "month"),
        };
      }
    }
  }

  const hasPendingRemoval =
    user.pendingSitePackCount != null &&
    user.pendingPackChangeAt != null &&
    user.pendingSitePackCount < (user.sitePackCount ?? 0);
  const pendingSites =
    hasPendingRemoval && plan !== "free"
      ? ((user.sitePackCount ?? 0) - (user.pendingSitePackCount ?? 0)) * SITE_PACKS[plan].sitesPerPack
      : 0;

  // Today's total (what the current period cost) and the next renewal's total, kept apart so
  // every surface shows "$X/year" now and "From {date}: $Y/year" when a change is booked.
  const monthlyTotalCents = recurringTotalCents(plan, packCount, interval);
  if (!next && plan !== "free") {
    const pendingPro = user.pendingPlan === "pro" && plan === "business";
    next = { plan: pendingPro ? "pro" : plan, packs: pendingPro ? 0 : hasPendingRemoval ? user.pendingSitePackCount! : packCount, interval };
  }
  const nextTotalCents = next ? recurringTotalCents(next.plan, next.packs, next.interval) : 0;
  const nextTotalFormatted = next ? formatRecurringFromCents(nextTotalCents, "usd", next.interval) : null;

  return NextResponse.json({
    healed,
    plan,
    planName: PLANS[plan].name,
    interval: plan === "free" ? null : interval,
    intervalLabel: plan === "free" ? null : intervalLabel(interval),
    sitePackCount: packCount,
    siteLimit,
    monthlyTotalCents,
    monthlyTotalFormatted: formatRecurringFromCents(monthlyTotalCents, "usd", interval),
    recurringBreakdown: plan === "free" ? null : recurringBreakdown(plan, packCount, interval),
    nextTotalCents,
    nextTotalFormatted,
    nextAmountFormatted: nextTotalFormatted?.replace(/\/(month|year)$/, "") ?? null,
    nextChanges: Boolean(next && (nextTotalCents !== monthlyTotalCents || next.interval !== interval)),
    pendingInterval: pendingMonthly ? "month" : null,
    pendingIntervalAtFormatted: pendingMonthly?.atFormatted ?? null,
    pendingIntervalPriceFormatted: pendingMonthly?.priceFormatted ?? null,
    nextPaymentDate,
    nextPaymentDateFormatted: formatShortDate(nextPaymentDate),
    currency: "usd",
    hasPendingRemoval,
    pendingSitePackCount: hasPendingRemoval ? user.pendingSitePackCount : null,
    pendingPackChangeAt: hasPendingRemoval ? user.pendingPackChangeAt?.toISOString() ?? null : null,
    pendingPackChangeAtFormatted: hasPendingRemoval ? formatShortDate(user.pendingPackChangeAt) : null,
    pendingSitesToRemove: pendingSites,
    cancelAtPeriodEnd: user.cancelAtPeriodEnd,
    pendingPlan: user.pendingPlan,
    pendingPlanAt: user.pendingPlanAt?.toISOString() ?? null,
    pendingPlanAtFormatted: user.pendingPlanAt ? formatShortDate(user.pendingPlanAt) : null,
    pendingTargetLimit: pendingTargetLimit(user),
    showDefaultLockNotice: user.showDefaultLockNotice,
    dodoStatus: user.dodoStatus,
    paymentFailed: user.dodoStatus === "on_hold" || user.dodoStatus === "past_due",
  });
}
