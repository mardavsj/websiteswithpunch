import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getEffectivePlan,
  getUserEffectiveSiteLimit,
  PLANS,
  resolvePackCountForLimit,
} from "@/lib/plans";
import { applyDuePendingAndEnforce } from "@/lib/site-limits";
import { PlanPageClient } from "@/components/plan/PlanPageClient";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  await applyDuePendingAndEnforce(session.user.id);
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  const sites = await prisma.site.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const plan = getEffectivePlan(user.plan, user.stripeStatus);
  const resolved = resolvePackCountForLimit({
    sitePackCount: user.sitePackCount,
    pendingSitePackCount: user.pendingSitePackCount,
    pendingPackChangeAt: user.pendingPackChangeAt,
  });
  const packCount = resolved.packCount;
  const limit = getUserEffectiveSiteLimit(
    plan,
    user.sitePackCount,
    user.pendingSitePackCount,
    user.pendingPackChangeAt,
  );
  const activeSites = sites.filter((s) => !s.locked);
  const lockedSites = sites.filter((s) => s.locked);
  const atLimit = activeSites.length >= limit;
  const remaining = Math.max(0, limit - activeSites.length);

  const keepOptions = activeSites.map((s) => ({
    id: s.id,
    name: s.name,
    url: s.url,
    createdAt: s.createdAt.toISOString(),
  }));
  const allOptions = sites.map((s) => ({
    id: s.id,
    name: s.name,
    url: s.url,
    createdAt: s.createdAt.toISOString(),
    locked: s.locked,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-medium text-ink">My Plan</h1>
      <p className="mt-1 text-sm text-muted">
        {PLANS[plan].name} · {activeSites.length}/{limit} active
        {lockedSites.length > 0 ? ` · ${lockedSites.length} locked` : ""}
      </p>
      <div className="mt-6">
        <PlanPageClient
          plan={plan}
          sitePackCount={packCount}
          siteCount={activeSites.length}
          siteLimit={limit}
          atLimit={atLimit}
          remaining={remaining}
          keepOptions={keepOptions}
          allSiteOptions={allOptions}
          cancelAtPeriodEnd={user.cancelAtPeriodEnd}
          pendingPlan={user.pendingPlan}
          pendingPlanAt={user.pendingPlanAt?.toISOString() ?? null}
          lockedCount={lockedSites.length}
          hasBilling={Boolean(user.stripeCustomerId)}
        />
      </div>
    </div>
  );
}
