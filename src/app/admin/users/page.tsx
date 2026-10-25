import { viewSection } from "@/lib/admin/seen";
import { SeenRefresh } from "@/components/admin/SeenRefresh";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/guard";
import { isVerified } from "@/lib/email-verify";
import { USER_PLANS, usersWhere } from "@/lib/admin/filters";
import { NewDot, AdminHeader, Badge, Filters, PAGE_SIZE, Pager, Panel, Table, fmtDate, pageOf, qs, td } from "@/components/admin/ui";
import { UserDrawer } from "@/components/admin/UserDrawer";

export const metadata = { title: "Users" };
type Search = { q?: string; plan?: string; page?: string; u?: string };

export default async function AdminUsers({ searchParams: sp }: { searchParams: Search }) {
  const admin = await requireAdmin();
  const q = (sp.q ?? "").trim().slice(0, 100);
  const plan = (USER_PLANS as readonly string[]).includes(sp.plan ?? "") ? sp.plan : undefined;
  const page = pageOf(sp.page);
  const where: Prisma.UserWhereInput = usersWhere({ q, plan });
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      select: { id: true, email: true, plan: true, dodoStatus: true, emailVerified: true, createdAt: true, _count: { select: { sites: true } }, referredBy: { select: { email: true } } },
    }),
  ]);
  const seen = await viewSection(admin.email!, ["users", "users:paid", "users:free", "users:pro", "users:business"], [plan ? `users:${plan}` : "users"]);
  const isNew = (d: Date | null | undefined) => Boolean(d && d > seen.since);
  const base = { q: q || undefined, plan, page: sp.page };

  return (
    <div className="space-y-4">
      <SeenRefresh on={seen.refresh} />
      <AdminHeader title="Users" sub="Read-only. Click a row for details." />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form action="/admin/users" className="flex min-w-0 flex-1 gap-2 sm:max-w-sm">
          {plan && <input type="hidden" name="plan" value={plan} />}
          <label htmlFor="user-q" className="sr-only">Search users</label>
          <input id="user-q" name="q" defaultValue={q} placeholder="Search email or name" className="min-w-0 flex-1 border border-rule bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none" />
          <button className="border border-rule px-3 py-2 text-sm font-medium text-ink hover:border-accent hover:text-accent">Search</button>
        </form>
        <Filters path="/admin/users" q={base} name="plan" badges={{ "": seen.counts.users, paid: seen.counts["users:paid"], free: seen.counts["users:free"], pro: seen.counts["users:pro"], business: seen.counts["users:business"] }} options={[["", "All"], ["paid", "Paying"], ["free", "Free"], ["pro", "Pro"], ["business", "Business"]]} />
      </div>
      <Panel>
        <Table head={["Email", "Plan", "Billing", "Sites", "Verified", "Joined", "Referred by"]} empty={users.length === 0}>
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-accent-soft">
              <td className={`${td} max-w-[240px] truncate`}><Link href={`/admin/users${qs(base, { u: u.id })}`} className="hover:text-accent"><NewDot on={isNew(u.createdAt)} />{u.email}</Link></td>
              <td className={td}><Badge tone={u.plan === "free" ? "muted" : "accent"}>{u.plan}</Badge></td>
              <td className={`${td} text-muted`}>{u.dodoStatus ?? "—"}</td>
              <td className={`${td} tabular-nums`}>{u._count.sites}</td>
              <td className={td}>{isVerified(u) ? <Badge tone="ok">yes</Badge> : <Badge>no</Badge>}</td>
              <td className={`${td} text-muted`}>{fmtDate(u.createdAt, false)}</td>
              <td className={`${td} max-w-[200px] truncate text-muted`}>{u.referredBy?.email ?? "—"}</td>
            </tr>
          ))}
        </Table>
        <Pager path="/admin/users" q={base} page={page} total={total} />
      </Panel>
      {sp.u && <UserDrawer id={sp.u} close={`/admin/users${qs(base, {})}`} />}
    </div>
  );
}
