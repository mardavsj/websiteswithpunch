import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteForm } from "@/components/SiteForm";

export default async function EditSitePage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const site = await prisma.site.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!site) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Edit site</h1>
      <SiteForm mode="edit" siteId={site.id} initialName={site.name} initialUrl={site.url} />
    </div>
  );
}
