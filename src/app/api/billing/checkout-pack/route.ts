import { NextResponse } from "next/server";
import { canBuySitePack, getEffectiveSiteLimit, getPackConfig } from "@/lib/plans";
import { applyChange, changeBody, resync } from "@/lib/dodo-change";
import { blockIfScheduled, fail, withSubscription } from "@/lib/billing-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Add one site pack now (pack add-on quantity + 1, prorated charge), or, while a pack removal
 * is booked for renewal, undo one step of it (nothing is charged).
 */
export async function POST() {
  return withSubscription({ label: "checkout-pack", rateKey: "checkout-pack" }, async ({ dodo, user, sub, st }) => {
    const config = getPackConfig(st.plan)!;
    const blocked = blockIfScheduled(st, ["packs"]);
    if (blocked) return blocked;

    if (st.scheduled && st.scheduled.packs < st.packs) {
      const target = st.scheduled.packs + 1;
      if (target >= st.packs) {
        await dodo.subscriptions.cancelChangePlan(sub.subscription_id);
      } else {
        const built = changeBody({ plan: st.plan, interval: st.interval, packs: target }, "renewal", st);
        if (!built.ok) return fail(503, built.error, "PRICE_MISSING");
        await dodo.subscriptions.changePlan(sub.subscription_id, built.body);
      }
      await resync(dodo, sub.subscription_id, user.id);
      return NextResponse.json({
        ok: true,
        undone: true,
        sitePackCount: st.packs,
        sitesPerPack: config.sitesPerPack,
      });
    }

    if (!canBuySitePack(st.plan, st.packs)) {
      const maxSites = getEffectiveSiteLimit(st.plan, config.maxPacks);
      const hint =
        st.plan === "pro"
          ? `You've reached the max Pro packs (${maxSites} sites). Upgrade to Business for more capacity.`
          : `You've reached the max Business packs (${maxSites} sites). Contact us from the Contact page for a custom limit.`;
      return fail(403, hint, "PACK_LIMIT", { maxPacks: config.maxPacks });
    }

    const next = st.packs + 1;
    const built = changeBody({ plan: st.plan, interval: st.interval, packs: next }, "now", st);
    if (!built.ok) return fail(503, built.error, "PRICE_MISSING");
    const { applied, fresh } = await applyChange(
      dodo,
      sub.subscription_id,
      user.id,
      built.body,
      (f) => f.packs >= next,
    );
    return NextResponse.json({
      ok: true,
      pending: !applied,
      sitePackCount: applied ? fresh.packs : st.packs,
      sitesPerPack: config.sitesPerPack,
    });
  });
}
