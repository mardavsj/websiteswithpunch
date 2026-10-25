import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/guard";
import { fmtUsd } from "@/lib/referrals/config";
import { referrerTotals } from "@/lib/admin/referrer";
import { AdminHeader, Badge, Filters, PAGE_SIZE, Pager, Panel, Table, fmtDate, pageOf, td } from "@/components/admin/ui";

export const metadata = { title: "Referrals" };
const STATUSES = ["available", "requested", "paid", "reversed"];

export default async function AdminReferrals({ searchParams: sp }: { searchParams: { status?: string; page?: string } }) {
  await requireAdmin();
  const status = STATUSES.includes(sp.status ?? "") ? sp.status : undefined;
  // Legacy "pending" rows count as available (the hold was removed).
  const where = status ? { status: status === "available" ? { in: ["available", "pending"] } : status } : {};
  const page = pageOf(sp.page);
  const [top, total, rows] = await Promise.all([
    prisma.commission.groupBy({ by: ["referrerId"], where: { status: { not: "reversed" } }, _sum: { amountCents: true }, _count: { _all: true }, orderBy: { _sum: { amountCents: "desc" } }, take: 10 }),
    prisma.commission.count({ where }),
    prisma.commission.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { referrer: { select: { email: true } }, referredUser: { select: { email: true } } } }),
  ]);
  const ids = top.map((t) => t.referrerId);
  const [people, totals] = await Promise.all([prisma.user.findMany({ where: { id: { in: top.map((t) => t.referrerId) } }, select: { id: true, email: true, referralClicks: true, _count: { select: { referrals: true } } } }), referrerTotals(ids)]);
  const who = new Map(people.map((p) => [p.id, p]));
  const base = { status, page: sp.page };

  return (
    <div className="space-y-6">
      <AdminHeader title="Referrals" sub="Top referrers and the full commission ledger. Each row is re-added from the ledger and checked against its payouts." />
      <Panel title="Top referrers">
        <Table head={["Referrer", "Clicks", "Signups", "Earned", "Available", "Requested", "Paid", "Owed back", "Check"]} empty={top.length === 0}>
          {top.map((t) => {
            const p = who.get(t.referrerId);
            const b = totals.get(t.referrerId);
            return (
              <tr key={t.referrerId}>
                <td className={`${td} max-w-[220px] truncate`}><Link href={`/admin/users?u=${t.referrerId}`} className="hover:text-accent">{p?.email ?? "Deleted user"}</Link></td>
                <td className={`${td} tabular-nums text-muted`}>{p?.referralClicks ?? 0}</td>
                <td className={`${td} tabular-nums text-muted`}>{p?._count.referrals ?? 0}</td>
                <td className={`${td} tabular-nums`}>{fmtUsd(b?.earned ?? 0)} <span className="text-xs text-muted">({t._count._all})</span></td>
                <td className={`${td} tabular-nums`}>{fmtUsd(b?.available ?? 0)}</td>
                <td className={`${td} tabular-nums`}>{fmtUsd(b?.requested ?? 0)}</td>
                <td className={`${td} tabular-nums`}>{fmtUsd(b?.paid ?? 0)}</td>
                <td className={`${td} tabular-nums ${b?.owed ? "text-danger" : "text-muted"}`}>{fmtUsd(b?.owed ?? 0)}</td>
                <td className={td}>{b && b.mismatched.length ? <Link href={`/admin/payouts?tab=all&p=${b.mismatched[0]}`} className="text-danger underline">Mismatch</Link> : <Badge tone="ok">OK</Badge>}</td>
              </tr>
            );
          })}
        </Table>
      </Panel>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-medium text-ink">Ledger</h2>
          <Filters path="/admin/referrals" q={base} name="status" options={[["", "All"], ...STATUSES.map((s): [string, string] => [s, s[0].toUpperCase() + s.slice(1)])]} />
        </div>
        <Panel>
          <Table head={["Date", "Referrer", "Paid by", "Base", "Commission", "Status"]} empty={rows.length === 0}>
            {rows.map((c) => (
              <tr key={c.id}>
                <td className={`${td} text-muted`}>{fmtDate(c.createdAt, false)}</td>
                <td className={`${td} max-w-[200px] truncate`}>{c.referrer.email}</td>
                <td className={`${td} max-w-[200px] truncate text-muted`}>{c.referredUser?.email ?? "—"}</td>
                <td className={`${td} tabular-nums text-muted`}>{fmtUsd(c.baseCents)}</td>
                <td className={`${td} tabular-nums`}>{fmtUsd(c.amountCents)}</td>
                <td className={td}>
                  <Badge tone={c.status === "paid" ? "ok" : c.status === "reversed" ? "danger" : c.status === "requested" ? "accent" : "muted"}>{c.status === "pending" ? "available" : c.status}</Badge>
                  {c.clawback && <span className="ml-1 text-xs text-danger">owed back</span>}
                </td>
              </tr>
            ))}
          </Table>
          <Pager path="/admin/referrals" q={base} page={page} total={total} />
        </Panel>
      </div>
    </div>
  );
}
