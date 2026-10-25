import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/guard";
import { AdminHeader, Filters, PAGE_SIZE, Pager, Panel, Table, fmtDate, pageOf, td } from "@/components/admin/ui";

export const metadata = { title: "Audit log" };

export default async function AdminAudit({ searchParams: sp }: { searchParams: { area?: string; page?: string } }) {
  await requireAdmin();
  const actions = await prisma.auditLog.findMany({ distinct: ["action"], select: { action: true }, take: 50 });
  const areas = [...new Set(actions.map((a) => a.action.split(".")[0]))].sort();
  const area = areas.includes(sp.area ?? "") ? sp.area : undefined;
  const where = area ? { action: { startsWith: area } } : {};
  const page = pageOf(sp.page);
  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
  ]);
  const actors = await prisma.user.findMany({ where: { id: { in: rows.map((r) => r.actorId).filter((x): x is string => Boolean(x)) } }, select: { id: true, email: true } });
  const email = new Map(actors.map((a) => [a.id, a.email]));
  const base = { area, page: sp.page };

  return (
    <div className="space-y-4">
      <AdminHeader title="Audit log" sub="Payout method changes, withdrawals and admin decisions." />
      {areas.length > 1 && <Filters path="/admin/audit" q={base} name="area" options={[["", "All"], ...areas.map((a): [string, string] => [a, a])]} />}
      <Panel>
        <Table head={["When", "Action", "Actor", "Target", "Details"]} empty={rows.length === 0}>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className={`${td} text-muted`}>{fmtDate(r.createdAt)}</td>
              <td className={`${td} font-mono text-xs`}>{r.action}</td>
              <td className={`${td} max-w-[200px] truncate`}>{r.actorId ? email.get(r.actorId) ?? r.actorId : "system"}</td>
              <td className={`${td} max-w-[140px] truncate font-mono text-xs text-muted`}>{r.targetId ?? "—"}</td>
              <td className={`${td} max-w-[280px] truncate font-mono text-xs text-muted`} title={r.meta ? JSON.stringify(r.meta) : ""}>{r.meta ? JSON.stringify(r.meta) : "—"}</td>
            </tr>
          ))}
        </Table>
        <Pager path="/admin/audit" q={base} page={page} total={total} />
      </Panel>
    </div>
  );
}
