import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  getEffectivePlan,
  getUserEffectiveSiteLimit,
  PLANS,
  resolvePackCountForLimit,
} from "@/lib/plans";
import { SiteCard } from "@/components/SiteCard";
import { SiteAnalytics } from "@/components/SiteAnalytics";
import { SiteRecheckScope } from "@/components/SiteRecheckProvider";
import { DashboardPackCta } from "@/components/DashboardPackCta";
import { DashboardAddSiteButton } from "@/components/DashboardAddSiteButton";
import { DashboardBanners } from "@/components/DashboardBanners";
import { DashboardPendingBanner } from "@/components/DashboardPendingBanner";
import { CheckoutReturn } from "@/components/billing/CheckoutReturn";
import { loadAccount } from "@/lib/account-load";
import { toDashboardSite } from "@/lib/dashboard-sites";
import { RememberLayout } from "@/components/skeleton/shape";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { checkout?: string; subscription_id?: string; status?: string };
}) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const { user, sites: sitesRaw } = await loadAccount(session.user.id);
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

  const activeSites = sitesRaw.filter((s) => !s.locked);
  const lockedSites = sitesRaw.filter((s) => s.locked);
  const atLimit = activeSites.length >= limit;
  const remaining = Math.max(0, limit - activeSites.length);
  const canUnlock = remaining > 0;
  const showInlineAnalytics = activeSites.length === 1 && lockedSites.length === 0;
  const planLabel = PLANS[plan].name;
  const displayName = user.name || "there";

  const clientSites = sitesRaw.map(toDashboardSite);

  const downNow = activeSites.filter(
    (s) => s.status === "down" || s.status === "error",
  ).length;
  const sslSoon = activeSites
    .map((s) => s.sslDaysLeft)
    .filter((d): d is number => d != null)
    .sort((a, b) => a - b)[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <RememberLayout
        plan={plan}
        active={activeSites.length}
        locked={lockedSites.length}
        limit={limit}
        billing={Boolean(user.dodoCustomerId)}
        cards={sitesRaw
          .slice(0, 12)
          .map((s): [number, number, number] => [s.name.length, s.url.length, s.locked ? 1 : 0])}
      />
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
          <DashboardAddSiteButton atLimit={atLimit} pickUpPending />
          <DashboardPackCta plan={plan} sitePackCount={packCount} />
        </div>
      </div>

      {searchParams.checkout && (
        <CheckoutReturn
          outcome={searchParams.checkout}
          subscriptionId={searchParams.subscription_id}
          status={searchParams.status}
          plan={plan}
        />
      )}

      <DashboardBanners
        showDefaultLockNotice={user.showDefaultLockNotice}
        paymentFailed={user.dodoStatus === "past_due" || user.dodoStatus === "on_hold"}
        onHold={user.dodoStatus === "on_hold"}
        siteLimit={limit}
        activeCount={activeSites.length}
      />

      <DashboardPendingBanner plan={plan} sitePackCount={packCount} />

      {activeSites.length > 1 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="border border-rule bg-surface p-4">
            <p className="label-caps text-muted">Sites monitored</p>
            <p className="mt-1 font-display text-2xl font-medium text-ink">
              {activeSites.length}
            </p>
          </div>
          <div className="border border-rule bg-surface p-4">
            <p className="label-caps text-muted">Down / error now</p>
            <p
              className={`mt-1 font-display text-2xl font-medium ${
                downNow > 0 ? "text-rose-700 dark:text-rose-300" : "text-ink"
              }`}
            >
              {downNow}
            </p>
          </div>
          <div className="border border-rule bg-surface p-4">
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
        // One site with inline analytics: its card shares the auto refresh timer.
        <SiteRecheckScope
          siteId={showInlineAnalytics ? activeSites[0].id : null}
          lastCheckedAt={
            showInlineAnalytics ? (activeSites[0].lastCheckedAt?.toISOString() ?? null) : null
          }
        >
          <div className="mt-8 space-y-5">
            {clientSites.map((site) => (
              <SiteCard
                key={site.id}
                showAnalyticsLink={!showInlineAnalytics && !site.locked}
                siteLimit={limit}
                canUnlock={site.locked && canUnlock}
                hasLockedSites={lockedSites.length > 0}
                site={site}
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
        </SiteRecheckScope>
      )}
    </div>
  );
}
