import { NextResponse } from "next/server";
import { PLANS } from "@/lib/plans";
import { packPrice, parseInterval, planPrice, type PaidPlanId } from "@/lib/billing-interval";
import { daysLeftInPeriod } from "@/lib/dodo-subscription";
import { changeBody, previewBody } from "@/lib/dodo-change";
import { blockIfScheduled, fail, withSubscription } from "@/lib/billing-route";
import { formatChargeToday, formatRecurringFromCents, formatShortDate } from "@/lib/billing-format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Preview an in-place change (Pro → Business, or monthly → annual) with Dodo's own numbers. */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  return previewPlan(params.get("planId"), params.get("interval"));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return previewPlan(body?.planId, body?.interval);
}

function previewPlan(rawPlan: unknown, rawInterval: unknown) {
  const targetPlan: PaidPlanId = rawPlan === "pro" ? "pro" : "business";
  const interval = parseInterval(rawInterval);
  return withSubscription({ label: "preview-plan" }, async ({ dodo, sub, st }) => {
    if (st.plan === targetPlan && st.interval === interval) {
      return fail(400, `You're already on ${PLANS[targetPlan].name} with this billing.`);
    }
    if (st.plan === "business" && targetPlan === "pro") {
      return fail(400, "To switch to Pro, use Switch to Pro in Your plan (takes effect at renewal).", "USE_DOWNGRADE");
    }
    if (st.interval === "year" && interval === "month") {
      return fail(400, "You're billed yearly, so plan changes stay on annual billing. Choose Annual.", "ANNUAL_ONLY");
    }
    const blocked = blockIfScheduled(st, ["packs"]);
    if (blocked) return blocked;

    const samePlan = st.plan === targetPlan;
    const keptPacks = samePlan ? (st.scheduled ? st.scheduled.packs : st.packs) : 0;
    const built = changeBody({ plan: targetPlan, interval, packs: keptPacks }, "now", st);
    if (!built.ok) return fail(503, built.error, "PRICE_MISSING");

    const preview = await dodo.subscriptions.previewChangePlan(sub.subscription_id, previewBody(built.body));
    const amountDueToday = preview.immediate_charge.summary.total_amount;
    const taxToday = preview.immediate_charge.summary.tax ?? 0;
    const currency = preview.immediate_charge.summary.currency || sub.currency || "USD";
    const nextRenewal = preview.new_plan.next_billing_date || null;
    const newRecurringCents =
      (planPrice(targetPlan, interval) + keptPacks * packPrice(targetPlan, interval)) * 100;

    return NextResponse.json({
      currentPlan: st.plan,
      currentPlanName: PLANS[st.plan].name,
      currentInterval: st.interval,
      targetPlan,
      targetPlanName: PLANS[targetPlan].name,
      interval,
      samePlan,
      intervalChanges: st.interval !== interval,
      keptPacks,
      hadPacks: !samePlan && st.packs > 0,
      amountDueToday,
      amountDueTodayFormatted: formatChargeToday(amountDueToday, currency),
      taxTodayFormatted: taxToday > 0 ? formatChargeToday(taxToday, currency) : null,
      daysLeftInPeriod: daysLeftInPeriod(st),
      nextRenewal,
      nextRenewalFormatted: formatShortDate(nextRenewal),
      newRecurringMonthlyCents: newRecurringCents,
      newRecurringMonthlyFormatted: formatRecurringFromCents(newRecurringCents, "usd", interval),
      currency,
    });
  });
}
