import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSiteLimit, isPro } from "@/lib/plans";
import { SiteCard } from "@/components/SiteCard";
import { UpgradeCTA } from "@/components/UpgradeCTA";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { upgraded?: string; canceled?: string };
}) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  const sites = await prisma.site.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const plan = isPro(user.plan, user.stripeStatus) ? "pro" : "free";
  const limit = getSiteLimit(plan);
  const atLimit = sites.length >= limit;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Welcome{user.name ? `, ${user.name}` : ""}. Plan:{" "}
            <span className="font-medium capitalize text-slate-900">{plan}</span> ·{" "}
            {sites.length}/{limit} sites
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <UpgradeCTA plan={plan} />
          {!atLimit ? (
            <Link
              href="/dashboard/sites/new"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Add site
            </Link>
          ) : (
            <span className="rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-500">
              Site limit reached
            </span>
          )}
        </div>
      </div>

      {searchParams.upgraded && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Upgrade successful (or checkout returned). Refresh if your plan has not updated yet —
          Stripe webhooks set Pro status.
        </div>
      )}
      {searchParams.canceled && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Checkout canceled. You can upgrade anytime.
        </div>
      )}

      {sites.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <h2 className="text-lg font-semibold text-slate-900">No sites yet</h2>
          <p className="mt-2 text-sm text-slate-600">
            Add your first URL to start uptime, SSL, and domain monitoring.
          </p>
          <Link
            href="/dashboard/sites/new"
            className="mt-6 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Add your first site
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5">
          {sites.map((site) => (
            <SiteCard
              key={site.id}
              site={{
                ...site,
                lastCheckedAt: site.lastCheckedAt?.toISOString() ?? null,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
