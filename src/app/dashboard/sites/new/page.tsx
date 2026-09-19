import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SiteForm } from "@/components/SiteForm";

export default async function NewSitePage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Add a site</h1>
      <SiteForm mode="create" />
    </div>
  );
}
