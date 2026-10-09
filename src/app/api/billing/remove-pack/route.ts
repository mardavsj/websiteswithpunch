import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getEffectiveSiteLimit, getPackConfig } from "@/lib/plans";
import { setKeepOnDowngrade } from "@/lib/site-limits";
import { changeBody, resync } from "@/lib/dodo-change";
import { blockIfScheduled, fail, withSubscription } from "@/lib/billing-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ keepSiteIds: z.array(z.string()).optional() });

/**
 * Book the removal of one site pack for the renewal date (Change Plan, next_billing_date +
 * full_immediately, the pairing Dodo requires; nothing is charged until renewal). The packs
 * stay until then; nothing is refunded or credited.
 * If the lower limit is below the active site count, keepSiteIds must pick the survivors.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  const keepSiteIds = parsed.success ? parsed.data.keepSiteIds ?? [] : [];

  return withSubscription({ label: "remove-pack" }, async ({ dodo, user, sub, st }) => {
    const config = getPackConfig(st.plan)!;
    const blocked = blockIfScheduled(st, ["packs"]);
    if (blocked) return blocked;
    if (!st.periodEnd) {
      return fail(500, "Could not determine your renewal date. Try again or open Manage billing.");
    }

    const currentTarget = st.scheduled && st.scheduled.packs < st.packs ? st.scheduled.packs : st.packs;
    if (currentTarget <= 0) return fail(400, "You have no site packs to remove.");
    const nextPending = currentTarget - 1;
    const newLimitFrom = getEffectiveSiteLimit(st.plan, nextPending);

    // Validated before anything changes so a failed request leaves nothing half-done.
    const built = changeBody({ plan: st.plan, interval: st.interval, packs: nextPending }, "renewal", st);
    if (!built.ok) return fail(503, built.error, "PRICE_MISSING");

    const activeCount = await prisma.site.count({ where: { userId: user.id, locked: false } });
    if (activeCount > newLimitFrom) {
      if (keepSiteIds.length !== newLimitFrom) {
        return fail(
          400,
          `Your plan will include ${newLimitFrom} sites. Choose which ones stay active.`,
          "KEEP_REQUIRED",
          { maxKeep: newLimitFrom, activeCount },
        );
      }
      const keep = await setKeepOnDowngrade(user.id, keepSiteIds, newLimitFrom);
      if (!keep.ok) return NextResponse.json(keep, { status: 400 });
    }

    await dodo.subscriptions.changePlan(sub.subscription_id, built.body);
    await resync(dodo, sub.subscription_id, user.id);

    return NextResponse.json({
      ok: true,
      sitePackCount: st.packs,
      pendingSitePackCount: nextPending,
      pendingPackChangeAt: st.periodEnd.toISOString(),
      sitesPerPack: config.sitesPerPack,
      keepSiteLimit: getEffectiveSiteLimit(st.plan, st.packs),
      newSiteLimitFromRenewal: newLimitFrom,
      activeCount,
    });
  });
}
