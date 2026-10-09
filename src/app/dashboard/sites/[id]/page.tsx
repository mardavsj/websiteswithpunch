import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteAnalytics } from "@/components/SiteAnalytics";
import { SiteCard } from "@/components/SiteCard";
import { SiteRecheckProvider } from "@/components/SiteRecheckProvider";
import { toClientSite } from "@/lib/client-site";

export const dynamic = "force-dynamic";

export default async function SiteAnalyticsPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  // Site + its freshest check (any kind, for the "Last check" label) in one parallel round trip;
  // the check query is scoped to the owner too, so it can't leak another user's data.
  const [site, latest] = await Promise.all([
    prisma.site.findFirst({ where: { id: params.id, userId: session.user.id } }),
    prisma.checkResult.findFirst({
      where: { siteId: params.id, site: { userId: session.user.id } },
      orderBy: [{ checkedAt: "desc" }, { id: "desc" }],
      select: { checkedAt: true },
    }),
  ]);
  if (!site) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-muted hover:text-accent">
          ← Dashboard
        </Link>
      </div>
      {/* One shared Recheck / auto refresh controller for the card + analytics. */}
      <SiteRecheckProvider
        siteId={site.id}
        lastCheckedAt={site.lastCheckedAt?.toISOString() ?? null}
      >
        <div className="space-y-5">
          <SiteCard
            showAnalyticsLink={false}
            site={{
              ...toClientSite(site),
              lastCheckedAt: site.lastCheckedAt?.toISOString() ?? null,
              lastSeenAt: latest?.checkedAt.toISOString() ?? null,
            }}
          />
          <SiteAnalytics siteId={site.id} />
        </div>
      </SiteRecheckProvider>
    </div>
  );
}
