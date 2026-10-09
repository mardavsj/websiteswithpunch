import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getEffectiveSiteLimit } from "@/lib/plans";
import { formatPlanPrice, planPrice } from "@/lib/billing-interval";
import { formatShortDate } from "@/lib/billing-format";
import { setKeepOnDowngrade } from "@/lib/site-limits";
import { changeBody, resync } from "@/lib/dodo-change";
import { blockIfScheduled, fail, withSubscription } from "@/lib/billing-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ keepSiteIds: z.array(z.string()).optional() });

/**
 * Book Business → Pro for the renewal date, same interval, Business packs dropped
 * (Change Plan, next_billing_date, do_not_bill). Business limits stay until then.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  const keepSiteIds = parsed.success ? parsed.data.keepSiteIds ?? [] : [];

  return withSubscription({ label: "downgrade" }, async ({ dodo, user, sub, st }) => {
    if (st.plan !== "business") {
      return fail(400, "Downgrade to Pro is only available from Business.");
    }
    const blocked = blockIfScheduled(st, ["packs"]);
    if (blocked) return blocked;
    const built = changeBody({ plan: "pro", interval: st.interval, packs: 0 }, "renewal", st);
    if (!built.ok) return fail(503, built.error, "PRICE_MISSING");

    const newLimit = getEffectiveSiteLimit("pro", 0);
    const activeCount = await prisma.site.count({ where: { userId: user.id, locked: false } });
    if (activeCount > newLimit) {
      if (keepSiteIds.length !== newLimit) {
        return fail(400, `Your Pro plan includes ${newLimit} sites. Choose which ones stay active.`, "KEEP_REQUIRED", {
          maxKeep: newLimit,
          activeCount,
        });
      }
      const keep = await setKeepOnDowngrade(user.id, keepSiteIds, newLimit);
      if (!keep.ok) return NextResponse.json(keep, { status: 400 });
    }

    await dodo.subscriptions.changePlan(sub.subscription_id, built.body);
    await resync(dodo, sub.subscription_id, user.id);

    const at = st.periodEnd;
    return NextResponse.json({
      ok: true,
      pendingPlan: "pro",
      pendingPlanAt: at?.toISOString() ?? null,
      pendingPlanAtFormatted: formatShortDate(at),
      keepLimitUntil: getEffectiveSiteLimit("business", st.packs),
      newLimitFrom: newLimit,
      interval: st.interval,
      newMonthly: planPrice("pro", st.interval),
      newRecurringFormatted: formatPlanPrice("pro", st.interval),
    });
  });
}
