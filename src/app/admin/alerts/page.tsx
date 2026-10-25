import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/guard";
import { AdminHeader, Badge, Filters, PAGE_SIZE, Pager, Panel, Table, fmtDate, pageOf, td } from "@/components/admin/ui";

export const metadata = { title: "Alerts" };
const KINDS = ["down", "recovered", "ssl", "domain"];

export default async function AdminAlerts({ searchParams: sp }: { searchParams: { kind?: string; sent?: string; page?: string } }) {
  await requireAdmin();
  const kind = KINDS.includes(sp.kind ?? "") ? sp.kind : undefined;
  const sent = sp.sent === "yes" || sp.sent === "no" ? sp.sent : undefined;
  const where = { ...(kind && { kind }), ...(sent && { sent: sent === "yes" }) };
  const page = pageOf(sp.page);
  const [total, rows] = await Promise.all([
    prisma.alertLog.count({ where }),
    prisma.alertLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { user: { select: { email: true } }, site: { select: { name: true, url: true } } } }),
  ]);
  const base = { kind, sent, page: sp.page };

  return (
    <div className="space-y-4">
      <AdminHeader title="Alerts" sub="Every alert email the monitor decided to send." />
      <div className="flex flex-wrap gap-3">
        <Filters path="/admin/alerts" q={base} name="kind" options={[["", "All kinds"], ["down", "Down"], ["recovered", "Recovered"], ["ssl", "SSL"], ["domain", "Domain"]]} />
        <Filters path="/admin/alerts" q={base} name="sent" options={[["", "Any"], ["yes", "Sent"], ["no", "Not sent"]]} />
      </div>
      <Panel>
        <Table head={["When", "Kind", "Site", "User", "Email"]} empty={rows.length === 0}>
          {rows.map((a) => (
            <tr key={a.id}>
              <td className={`${td} text-muted`}>{fmtDate(a.createdAt)}</td>
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
