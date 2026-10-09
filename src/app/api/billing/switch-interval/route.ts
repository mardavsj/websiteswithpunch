import { NextResponse } from "next/server";
import { scheduledKind } from "@/lib/dodo-subscription";
import { changeBody, resync } from "@/lib/dodo-change";
import { blockIfScheduled, fail, withSubscription, type BillingCtx } from "@/lib/billing-route";
import { recurringBreakdown, recurringTotalCents } from "@/lib/billing-totals";
import { formatRecurringFromCents, formatShortDate } from "@/lib/billing-format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Annual → monthly at renewal. GET = preview, POST = book it (Change Plan to the monthly
 * product + monthly pack add-on, next_billing_date, do_not_bill), DELETE = keep annual.
 * Nothing is charged, refunded or credited: the paid year runs out, then monthly starts.
 */
function plan({ st }: BillingCtx) {
  if (st.interval !== "year") return { error: fail(400, "You're already billed monthly.") };
  if (st.cancelAtPeriodEnd) {
    return { error: fail(400, "Your plan is set to end at renewal. Resume it first to switch to monthly.") };
  }
  const blocked = blockIfScheduled(st, ["packs"]);
  if (blocked) return { error: blocked };
  if (!st.periodEnd) {
    return { error: fail(500, "Could not determine your renewal date. Try again or open Manage billing.") };
  }
  const packs = st.scheduled ? st.scheduled.packs : st.packs;
  return { packs, at: st.periodEnd };
}

export async function GET() {
  return withSubscription({ label: "switch-interval preview" }, async (ctx) => {
    const p = plan(ctx);
    if ("error" in p) return p.error!;
    const cents = recurringTotalCents(ctx.st.plan, p.packs, "month");
    return NextResponse.json({
      plan: ctx.st.plan,
      packs: p.packs,
      switchAt: p.at.toISOString(),
      switchAtFormatted: formatShortDate(p.at),
      newRecurringFormatted: formatRecurringFromCents(cents, "usd", "month"),
      recurringBreakdown: recurringBreakdown(ctx.st.plan, p.packs, "month"),
    });
  });
}

export async function POST() {
  return withSubscription({ label: "switch-interval" }, async (ctx) => {
    const p = plan(ctx);
    if ("error" in p) return p.error!;
    const built = changeBody({ plan: ctx.st.plan, interval: "month", packs: p.packs }, "renewal", ctx.st);
    if (!built.ok) return fail(503, built.error, "PRICE_MISSING");
    await ctx.dodo.subscriptions.changePlan(ctx.sub.subscription_id, built.body);
    await resync(ctx.dodo, ctx.sub.subscription_id, ctx.user.id);
    return NextResponse.json({ ok: true, switchAt: p.at.toISOString(), switchAtFormatted: formatShortDate(p.at) });
  });
}

export async function DELETE() {
  return withSubscription({ label: "switch-interval cancel" }, async ({ dodo, user, sub, st }) => {
    if (scheduledKind(st) !== "interval") return fail(400, "No switch to monthly is scheduled.");
    await dodo.subscriptions.cancelChangePlan(sub.subscription_id);
    await resync(dodo, sub.subscription_id, user.id);
    return NextResponse.json({ ok: true });
  });
}
