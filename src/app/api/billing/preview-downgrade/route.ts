import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectiveSiteLimit, PLANS } from "@/lib/plans";
import { formatPlanPrice } from "@/lib/billing-interval";
import { formatShortDate } from "@/lib/billing-format";
import { blockIfScheduled, fail, withSubscription } from "@/lib/billing-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Business → Pro at renewal: what stays until then and what applies after. */
export async function GET() {
  return withSubscription({ label: "preview-downgrade" }, async ({ user, st }) => {
    if (st.plan !== "business") return fail(400, "Not on Business.");
    const blocked = blockIfScheduled(st, ["packs"]);
    if (blocked) return blocked;

    const activeCount = await prisma.site.count({ where: { userId: user.id, locked: false } });
    const newLimit = getEffectiveSiteLimit("pro", 0);
    const renew = st.periodEnd?.toISOString() ?? null;
    return NextResponse.json({
      action: "downgrade",
      amountDueToday: 0,
      amountDueTodayFormatted: "$0.00",
      nextRenewal: renew,
      nextRenewalFormatted: formatShortDate(renew),
      keepPlanUntil: "Business",
      keepSiteLimitUntilRenewal: getEffectiveSiteLimit("business", st.packs),
      newPlan: "pro",
      newPlanName: PLANS.pro.name,
      newSiteLimitFromRenewal: newLimit,
      interval: st.interval,
      newRecurringMonthlyFormatted: formatPlanPrice("pro", st.interval),
      activeCount,
      needsKeepPicker: activeCount > newLimit,
      maxKeep: newLimit,
    });
  });
}
