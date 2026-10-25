import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/guard";
import { AdminNav } from "@/components/admin/AdminNav";
import { SECTION_KEY, newCounts } from "@/lib/admin/seen";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

/** Every /admin page sits behind this check (pages check again); non-admins get a 404. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const n = await newCounts(admin.email!, Object.values(SECTION_KEY));
  const counts = Object.fromEntries(Object.entries(SECTION_KEY).map(([href, k]) => [href, n[k] ?? 0]));
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 md:py-10">
      <div className="md:grid md:grid-cols-[180px_minmax(0,1fr)] md:gap-8">
        <aside className="md:sticky md:top-24 md:self-start">
          <p className="label-caps hidden px-3 pb-2 md:block">Admin</p>
          <AdminNav counts={counts} />
        </aside>
        <div className="mt-6 min-w-0 md:mt-0">{children}</div>
      </div>
    </div>
  );
}
