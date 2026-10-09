import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getEffectivePlan, getUserEffectiveSiteLimit, resolvePackCountForLimit } from "@/lib/plans";
import { loadAccount } from "@/lib/account-load";
import { PlanPageClient } from "@/components/plan/PlanPageClient";
import { SessionPlanSync } from "@/components/SessionPlanSync";
import { RememberLayout } from "@/components/skeleton/shape";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const { user, sites } = await loadAccount(session.user.id);
  if (!user) redirect("/login");

  const plan = getEffectivePlan(user.plan, user.dodoStatus);
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

  // Centred between the navbar and the footer (SiteChrome makes <main> a flex column filling that
  // space); starts at the top and scrolls when taller (safe alignment, the box grows with it).
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 items-center [align-items:safe_center] px-4 py-10 sm:px-6">
      <SessionPlanSync plan={plan} />
      <RememberLayout
        plan={plan}
        active={activeSites.length}
        locked={lockedSites.length}
        limit={limit}
        billing={Boolean(user.dodoCustomerId)}
      />
      <div className="w-full">
        <h1 className="font-display text-2xl font-medium text-ink sm:text-3xl">My plan</h1>
        <p className="mt-1 text-sm text-muted">What you pay, what you get and every receipt, in one place.</p>
        <div className="mt-6">
          <PlanPageClient
            plan={plan}
            sitePackCount={packCount}
            siteCount={activeSites.length}
            siteLimit={limit}
            atLimit={atLimit}
            remaining={remaining}
            keepOptions={keepOptions}
            cancelAtPeriodEnd={user.cancelAtPeriodEnd}
            pendingPlan={user.pendingPlan}
            pendingPlanAt={user.pendingPlanAt?.toISOString() ?? null}
            lockedCount={lockedSites.length}
            hasBilling={Boolean(user.dodoCustomerId)}
          />
        </div>
      </div>
    </div>
  );
}
