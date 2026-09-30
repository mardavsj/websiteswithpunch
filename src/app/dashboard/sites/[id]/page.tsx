import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteAnalytics } from "@/components/SiteAnalytics";
import { TechStackCard } from "@/components/TechStackCard";
import { SiteCard } from "@/components/SiteCard";
import { SiteRecheckProvider } from "@/components/SiteRecheckProvider";

export const dynamic = "force-dynamic";

export default async function SiteAnalyticsPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const site = await prisma.site.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!site) notFound();

  // Freshest check of any kind (history row), for the "Last check" label.
  const latest = await prisma.checkResult.findFirst({
    where: { siteId: site.id },
    orderBy: [{ checkedAt: "desc" }, { id: "desc" }],
    select: { checkedAt: true },
  });

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
              ...site,
              lastCheckedAt: site.lastCheckedAt?.toISOString() ?? null,
              lastSeenAt: latest?.checkedAt.toISOString() ?? null,
            }}
          />
          <SiteAnalytics siteId={site.id} />
          {/* Separate card: not tied to Recheck / auto refresh. Hidden when locked. */}
          {!site.locked && <TechStackCard siteId={site.id} />}
        </div>
      </SiteRecheckProvider>
    </div>
  );
}
