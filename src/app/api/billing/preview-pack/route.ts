import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canBuySitePack, getEffectiveSiteLimit, getPackConfig, PLANS } from "@/lib/plans";
import { daysLeftInPeriod } from "@/lib/dodo-subscription";
import { changeBody, previewBody } from "@/lib/dodo-change";
import { blockIfScheduled, fail, withSubscription } from "@/lib/billing-route";
import { recurringBreakdown, recurringTotalCents } from "@/lib/billing-totals";
import { formatChargeToday, formatRecurringFromCents, formatShortDate } from "@/lib/billing-format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Action = "add" | "remove";

/** Price preview for adding a pack (Dodo's prorated amount) or booking a removal ($0 today). */
function preview(action: Action) {
  return withSubscription({ label: "preview-pack" }, async ({ dodo, user, sub, st }) => {
    const config = getPackConfig(st.plan)!;
    const blocked = blockIfScheduled(st, ["packs"]);
    if (blocked) return blocked;

    const siteCount = await prisma.site.count({ where: { userId: user.id } });
    const next = st.periodEnd?.toISOString() ?? null;
    const currency = sub.currency || "USD";
    const pendingTarget = st.scheduled && st.scheduled.packs < st.packs ? st.scheduled.packs : null;
    const common = {
      interval: st.interval,
      sitesPerPack: config.sitesPerPack,
      plan: st.plan,
      planName: PLANS[st.plan].name,
      siteCount,
      nextRenewal: next,
      nextRenewalFormatted: formatShortDate(next),
      daysLeftInPeriod: daysLeftInPeriod(st),
      currency,
      currentPackCount: st.packs,
    };
    const recurring = (packs: number) => ({
      newRecurringMonthlyCents: recurringTotalCents(st.plan, packs, st.interval),
      newRecurringMonthlyFormatted: formatRecurringFromCents(
        recurringTotalCents(st.plan, packs, st.interval),
        "usd",
        st.interval,
      ),
      recurringBreakdown: recurringBreakdown(st.plan, packs, st.interval),
    });

    if (action === "remove") {
      const from = pendingTarget ?? st.packs;
      if (from <= 0) return fail(400, "You have no site packs to remove.");
      const nextPack = from - 1;
      return NextResponse.json({
        action: "remove",
        ...common,
        keepSiteLimitUntilRenewal: getEffectiveSiteLimit(st.plan, st.packs),
        newSiteLimitFromRenewal: getEffectiveSiteLimit(st.plan, nextPack),
        amountDueToday: 0,
        amountDueTodayFormatted: formatChargeToday(0, currency),
        ...recurring(nextPack),
        nextPackCount: nextPack,
      });
    }

    const isUndo = pendingTarget != null;
    if (!isUndo && !canBuySitePack(st.plan, st.packs)) {
      return fail(403, "Pack limit reached.", "PACK_LIMIT", { maxPacks: config.maxPacks });
    }
    let amountDueToday = 0;
    let taxToday = 0;
    let renewal = { nextRenewal: next, nextRenewalFormatted: formatShortDate(next) };
    if (!isUndo) {
      const built = changeBody({ plan: st.plan, interval: st.interval, packs: st.packs + 1 }, "now", st);
      if (!built.ok) return fail(503, built.error, "PRICE_MISSING");
      const p = await dodo.subscriptions.previewChangePlan(sub.subscription_id, previewBody(built.body));
      amountDueToday = p.immediate_charge.summary.total_amount;
      taxToday = p.immediate_charge.summary.tax ?? 0;
      // Charging now starts a new billing cycle at Dodo, so the renewal date moves.
      const moved = p.new_plan.next_billing_date || next;
      renewal = { nextRenewal: moved, nextRenewalFormatted: formatShortDate(moved) };
    }
    const packs = isUndo ? st.packs : st.packs + 1;
    return NextResponse.json({
      action: "add",
      isUndo,
      ...common,
      ...renewal,
      amountDueToday,
      amountDueTodayFormatted: formatChargeToday(amountDueToday, currency),
      taxTodayFormatted: taxToday > 0 ? formatChargeToday(taxToday, currency) : null,
      ...recurring(packs),
      nextPackCount: packs,
      newSiteLimit: getEffectiveSiteLimit(st.plan, packs),
    });
  });
}

export async function GET(req: Request) {
  return preview(new URL(req.url).searchParams.get("action") === "remove" ? "remove" : "add");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return preview(body?.action === "remove" ? "remove" : "add");
}
