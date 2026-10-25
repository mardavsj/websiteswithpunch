import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/guard";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

/** Every /admin page sits behind this check (pages check again); non-admins get a 404. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 md:py-10">
      <div className="md:grid md:grid-cols-[180px_minmax(0,1fr)] md:gap-8">
        <aside className="md:sticky md:top-24 md:self-start">
          <p className="label-caps hidden px-3 pb-2 md:block">Admin</p>
          <AdminNav />
        </aside>
        <div className="mt-6 min-w-0 md:mt-0">{children}</div>
      </div>
    </div>
  );
}
