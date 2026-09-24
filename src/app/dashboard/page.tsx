import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan, getEffectiveSiteLimit, PLANS } from "@/lib/plans";
import { monthlyTotalDollars } from "@/lib/stripe-subscription";
import { SiteCard } from "@/components/SiteCard";
import { SiteAnalytics } from "@/components/SiteAnalytics";
import { UpgradeCTA } from "@/components/UpgradeCTA";
import { SignOutButton } from "@/components/SignOutButton";
import { SiteCapacityActions } from "@/components/SiteCapacityActions";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { upgraded?: string; canceled?: string; pack?: string };
}) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  const sites = await prisma.site.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const plan = getEffectivePlan(user.plan, user.stripeStatus);
  const packCount = user.sitePackCount ?? 0;
  const limit = getEffectiveSiteLimit(plan, packCount);
  const atLimit = sites.length >= limit;
  const remaining = Math.max(0, limit - sites.length);
  const showInlineAnalytics = sites.length === 1;
  const planLabel = PLANS[plan].name;
  const monthlyTotal = monthlyTotalDollars(plan, packCount);

  const downNow = sites.filter((s) => s.status === "down" || s.status === "error").length;
  const sslSoon = sites
    .map((s) => s.sslDaysLeft)
    .filter((d): d is number => d != null)
    .sort((a, b) => a - b)[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            Welcome{user.name ? `, ${user.name}` : ""}. Plan:{" "}
            <span className="font-medium text-ink">{planLabel}</span> · {sites.length}/{limit}{" "}
            sites
            {packCount > 0 ? (
              <span>
                {" "}
                (includes {packCount} site pack{packCount === 1 ? "" : "s"})
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SignOutButton />
          <UpgradeCTA plan={plan} />
          {!atLimit ? (
            <Link
              href="/dashboard/sites/new"
              className="rounded-none bg-ink px-4 py-2 text-sm font-medium text-bg hover:opacity-90"
            >
              Add site
            </Link>
          ) : (
            <span className="rounded-none border border-rule bg-accent-soft px-4 py-2 text-sm text-muted">
              Site limit reached
            </span>
          )}
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

      <SiteCapacityActions
        plan={plan}
        sitePackCount={packCount}
        siteCount={sites.length}
        atLimit={atLimit}
        remaining={remaining}
        monthlyTotal={monthlyTotal}
      />

      {sites.length > 1 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="border border-rule p-4">
            <p className="label-caps text-muted">Sites monitored</p>
            <p className="mt-1 font-display text-2xl font-medium text-ink">{sites.length}</p>
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

      {sites.length === 0 ? (
        <div className="mt-12 rounded-none border border-dashed border-rule bg-bg p-12 text-center">
          <h2 className="font-display text-lg font-medium text-ink">No sites yet</h2>
          <p className="mt-2 text-sm text-muted">
            Add your first URL to start uptime, SSL, and domain monitoring.
          </p>
          <Link
            href="/dashboard/sites/new"
            className="mt-6 inline-flex rounded-none bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Add your first site
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {sites.map((site) => (
            <SiteCard
              key={site.id}
              showAnalyticsLink={!showInlineAnalytics}
              site={{
                ...site,
                lastCheckedAt: site.lastCheckedAt?.toISOString() ?? null,
              }}
            />
          ))}
          {showInlineAnalytics && <SiteAnalytics siteId={sites[0].id} />}
          {!showInlineAnalytics && (
            <p className="text-center text-sm text-muted">
              Open <span className="font-medium text-ink">Analytics →</span> on any site for the full
              breakdown with range filters.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
