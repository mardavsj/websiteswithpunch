import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getEffectivePlan,
  getUserEffectiveSiteLimit,
  PLANS,
  resolvePackCountForLimit,
} from "@/lib/plans";
import { SiteCard } from "@/components/SiteCard";
import { SiteAnalytics } from "@/components/SiteAnalytics";
import { DashboardPackCta } from "@/components/DashboardPackCta";
import { DashboardAddSiteButton } from "@/components/DashboardAddSiteButton";
import { DashboardBanners } from "@/components/DashboardBanners";
import { DashboardPendingBanner } from "@/components/DashboardPendingBanner";
import {
  applyDuePendingAndEnforce,
  toClientSite,
} from "@/lib/site-limits";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { upgraded?: string; canceled?: string; pack?: string };
}) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  await applyDuePendingAndEnforce(session.user.id);

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  const sitesRaw = await prisma.site.findMany({
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

  const activeSites = sitesRaw.filter((s) => !s.locked);
  const lockedSites = sitesRaw.filter((s) => s.locked);
  const atLimit = activeSites.length >= limit;
  const remaining = Math.max(0, limit - activeSites.length);
  const canUnlock = remaining > 0;
  const showInlineAnalytics = activeSites.length === 1 && lockedSites.length === 0;
  const planLabel = PLANS[plan].name;
  const displayName = user.name || "there";

  const clientSites = sitesRaw.map((site) => {
    const stripped = toClientSite(site as unknown as Record<string, unknown>);
    return {
      ...stripped,
      lastCheckedAt:
        site.locked || !site.lastCheckedAt
          ? null
          : site.lastCheckedAt.toISOString(),
      locked: site.locked,
      createdAt: site.createdAt.toISOString(),
    };
  });

  const downNow = activeSites.filter(
    (s) => s.status === "down" || s.status === "error",
  ).length;
  const sslSoon = activeSites
    .map((s) => s.sslDaysLeft)
    .filter((d): d is number => d != null)
    .sort((a, b) => a - b)[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-ink">
            Welcome, {displayName}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Current plan:{" "}
            <span className="font-medium text-ink">{planLabel}</span> ·{" "}
            {activeSites.length}/{limit} active
            {lockedSites.length > 0 ? (
              <span>
                {" "}
                · {lockedSites.length} locked
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DashboardAddSiteButton atLimit={atLimit} />
          <DashboardPackCta plan={plan} sitePackCount={packCount} />
        </div>
      </div>

      {searchParams.upgraded && (
        <div className="mt-6 rounded-none border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Upgrade successful (or checkout returned). Refresh if your plan has not updated yet —
          billing webhooks set plan status.
        </div>
      )}
      {searchParams.pack && (
        <div className="mt-6 rounded-none border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          If you completed a pack payment, your site limit updates automatically — refresh if needed.
        </div>
      )}
      {searchParams.canceled && (
        <div className="mt-6 rounded-none border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Checkout canceled. You can upgrade anytime.
        </div>
      )}

      <DashboardBanners
        showDefaultLockNotice={user.showDefaultLockNotice}
        paymentFailed={user.stripeStatus === "past_due"}
        siteLimit={limit}
        activeCount={activeSites.length}
      />

      <DashboardPendingBanner plan={plan} sitePackCount={packCount} />

      {activeSites.length > 1 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="border border-rule p-4">
            <p className="label-caps text-muted">Sites monitored</p>
            <p className="mt-1 font-display text-2xl font-medium text-ink">
              {activeSites.length}
            </p>
          </div>
          <div className="border border-rule p-4">
            <p className="label-caps text-muted">Down / error now</p>
            <p
              className={`mt-1 font-display text-2xl font-medium ${
                downNow > 0 ? "text-rose-700" : "text-ink"
              }`}
            >
              {downNow}
            </p>
          </div>
          <div className="border border-rule p-4">
            <p className="label-caps text-muted">Nearest SSL expiry</p>
            <p className="mt-1 font-display text-2xl font-medium text-ink">
              {sslSoon == null ? "—" : `${sslSoon}d`}
            </p>
          </div>
        </div>
      )}

      {sitesRaw.length === 0 ? (
        <div className="mt-12 rounded-none border border-dashed border-rule bg-bg p-12 text-center">
          <h2 className="font-display text-lg font-medium text-ink">No sites yet</h2>
          <p className="mt-2 text-sm text-muted">
            Add your first URL to start uptime, SSL, and domain monitoring.
          </p>
          <div className="mt-6">
            <DashboardAddSiteButton
              atLimit={atLimit}
              label="Add your first site"
              variant="accent"
            />
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {clientSites.map((site) => (
            <SiteCard
              key={site.id as string}
              showAnalyticsLink={!showInlineAnalytics && !site.locked}
              siteLimit={limit}
              canUnlock={Boolean(site.locked) && canUnlock}
              hasLockedSites={lockedSites.length > 0}
              site={{
                id: site.id as string,
                name: site.name as string,
                url: site.url as string,
                status: site.status as string,
                lastCheckedAt: (site.lastCheckedAt as string | null) ?? null,
                lastStatusCode: (site.lastStatusCode as number | null) ?? null,
                lastLatencyMs: (site.lastLatencyMs as number | null) ?? null,
                sslDaysLeft: (site.sslDaysLeft as number | null) ?? null,
                domainDaysLeft: (site.domainDaysLeft as number | null) ?? null,
                locked: Boolean(site.locked),
              }}
            />
          ))}
          {showInlineAnalytics && <SiteAnalytics siteId={activeSites[0].id} />}
          {!showInlineAnalytics && activeSites.length > 1 && (
            <p className="text-center text-sm text-muted">
              Open <span className="font-medium text-ink">Analytics →</span> on any active site for
              the full breakdown with range filters.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
