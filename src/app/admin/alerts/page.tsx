import { viewSection } from "@/lib/admin/seen";
import { SeenRefresh } from "@/components/admin/SeenRefresh";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/guard";
import { alertsWhere, rangeOf } from "@/lib/admin/filters";
import { NewDot, AdminHeader, Badge, Filters, PAGE_SIZE, Pager, Panel, Table, fmtDate, pageOf, td } from "@/components/admin/ui";

export const metadata = { title: "Alerts" };

export default async function AdminAlerts({ searchParams: sp }: { searchParams: { kind?: string; sent?: string; range?: string; page?: string } }) {
  const admin = await requireAdmin();
  const where = alertsWhere({ kind: sp.kind, sent: sp.sent, range: rangeOf(sp.range) });
  const kind = where.kind as string | undefined;
  const sent = sp.sent === "yes" || sp.sent === "no" ? sp.sent : undefined;
  const range = rangeOf(sp.range);
  const filtered = Boolean(kind || sent || range);
  const page = pageOf(sp.page);
  const [total, rows] = await Promise.all([
    prisma.alertLog.count({ where }),
    prisma.alertLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { user: { select: { email: true } }, site: { select: { name: true, url: true } } } }),
  ]);
  const seen = await viewSection(admin.email!, ["alerts", "alerts:down", "alerts:recovered", "alerts:ssl", "alerts:domain"], [kind ? `alerts:${kind}` : "alerts"]);
  const isNew = (d: Date | null | undefined) => Boolean(d && d > seen.since);
  const base = { kind, sent, range, page: sp.page };

  return (
    <div className="space-y-4">
      <SeenRefresh on={seen.refresh} />
      <AdminHeader title="Alerts" sub="Every alert email the monitor decided to send. Why a down site has none: open it in Sites." />
      <div className="flex flex-wrap gap-3">
        <Filters path="/admin/alerts" q={base} name="kind" badges={{ "": seen.counts.alerts, down: seen.counts["alerts:down"], recovered: seen.counts["alerts:recovered"], ssl: seen.counts["alerts:ssl"], domain: seen.counts["alerts:domain"] }} options={[["", "All kinds"], ["down", "Down"], ["recovered", "Recovered"], ["ssl", "SSL"], ["domain", "Domain"]]} />
        <Filters path="/admin/alerts" q={base} name="sent" options={[["", "Any"], ["yes", "Sent"], ["no", "Not sent"]]} />
        <Filters path="/admin/alerts" q={base} name="range" options={[["", "All time"], ["7d", "Last 7 days"], ["30d", "Last 30 days"]]} />
      </div>
      <Panel>
        <Table head={["When", "Kind", "Site", "User", "Email"]} empty={rows.length === 0} emptyText={filtered ? "No alerts match these filters." : <>No alert emails sent yet. Alerts are logged when a daily check or Recheck finds a change (site down or back up, SSL or domain expiring). See <a href="/admin/sites?status=down" className="text-accent hover:underline">down sites</a> for why one hasn&apos;t alerted.</>}>
          {rows.map((a) => (
            <tr key={a.id}>
              <td className={`${td} text-muted`}><NewDot on={isNew(a.createdAt)} />{fmtDate(a.createdAt)}</td>
              <td className={td}><Badge tone={a.kind === "down" ? "danger" : a.kind === "recovered" ? "ok" : "accent"}>{a.kind}</Badge></td>
              <td className={`${td} max-w-[220px] truncate`} title={a.site.url}>{a.site.name}</td>
              <td className={`${td} max-w-[220px] truncate text-muted`}>{a.user.email}</td>
              <td className={td}>{a.sent ? <Badge tone="ok">sent</Badge> : <Badge>not sent</Badge>}</td>
            </tr>
          ))}
        </Table>
        <Pager path="/admin/alerts" q={base} page={page} total={total} />
      </Panel>
    </div>
  );
}
