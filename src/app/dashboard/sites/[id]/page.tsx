import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteAnalytics } from "@/components/SiteAnalytics";
import { StatusBadge } from "@/components/StatusBadge";

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
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-medium text-ink">{site.name}</h1>
          <StatusBadge status={site.status} />
        </div>
        <a
          href={site.url}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block text-sm text-accent hover:underline"
        >
          {site.url}
        </a>
      </div>
      <SiteAnalytics siteId={site.id} />
    </div>
  );
}
