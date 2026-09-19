import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteAnalytics } from "@/components/SiteAnalytics";
import { SiteCard } from "@/components/SiteCard";

export const dynamic = "force-dynamic";

export default async function SiteAnalyticsPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const site = await prisma.site.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!site) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-muted hover:text-accent">
          ← Dashboard
        </Link>
      </div>
      <div className="space-y-5">
        <SiteCard
          showAnalyticsLink={false}
          site={{
            ...site,
            lastCheckedAt: site.lastCheckedAt?.toISOString() ?? null,
          }}
        />
        <SiteAnalytics siteId={site.id} />
      </div>
    </div>
  );
}
