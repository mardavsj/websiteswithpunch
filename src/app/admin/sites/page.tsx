import { viewSection } from "@/lib/admin/seen";
import { SeenRefresh } from "@/components/admin/SeenRefresh";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/guard";
import { siteFilterOf, sitesWhere } from "@/lib/admin/filters";
import { NewDot, AdminHeader, Filters, PAGE_SIZE, Pager, Panel, Table, fmtDate, pageOf, qs, td } from "@/components/admin/ui";
import { Days, SiteStatus } from "@/components/admin/SiteBadges";
import { SiteDrawer } from "@/components/admin/SiteDrawer";

export const metadata: Metadata = { title: "Sites · Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminSites({ searchParams: sp }: { searchParams: { q?: string; status?: string; page?: string; s?: string } }) {
  const admin = await requireAdmin();
  const q = sp.q?.trim().slice(0, 100) || undefined;
  const status = siteFilterOf(sp.status);
  const where = sitesWhere({ q, status });
  const page = pageOf(sp.page);
  const [total, rows] = await Promise.all([
    prisma.site.count({ where }),
    prisma.site.findMany({
      where, orderBy: [{ lastCheckedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }], skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      select: { id: true, createdAt: true, name: true, url: true, status: true, locked: true, lastCheckedAt: true, sslDaysLeft: true, domainDaysLeft: true, alertDownAt: true, user: { select: { email: true } }, alertLogs: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true, kind: true, sent: true } } },
    }),
  ]);
  const seen = await viewSection(admin.email!, ["sites", "sites:down", "sites:ssl", "sites:domain", "sites:monitored", "sites:locked"], [status ? `sites:${status}` : "sites"]);
  const isNew = (d: Date | null | undefined) => Boolean(d && d > seen.since);
  const base = { q, status, page: sp.page };
  const close = `/admin/sites${qs(base, {})}`;

  return (
    <div className="space-y-4">
      <SeenRefresh on={seen.refresh} />
      <AdminHeader title="Sites" sub="Every monitored site, its last check and the alerts it has sent." />
      <div className="flex flex-wrap items-center gap-3">
        <form action="/admin/sites" className="flex min-w-0 flex-1 gap-2 sm:max-w-sm">
          {status && <input type="hidden" name="status" value={status} />}
          <label htmlFor="site-q" className="sr-only">Search sites</label>
          <input id="site-q" name="q" defaultValue={q} placeholder="Search name, URL or owner" className="min-w-0 flex-1 border border-rule bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none" />
          <button className="border border-rule px-3 py-2 text-sm font-medium text-ink hover:border-accent hover:text-accent">Search</button>
        </form>
        <Filters path="/admin/sites" q={base} name="status" badges={{ "": seen.counts.sites, down: seen.counts["sites:down"], ssl: seen.counts["sites:ssl"], domain: seen.counts["sites:domain"], monitored: seen.counts["sites:monitored"], locked: seen.counts["sites:locked"] }} options={[["", "All"], ["down", "Down"], ["ssl", "SSL ≤30d"], ["domain", "Domain ≤30d"], ["monitored", "Monitored"], ["locked", "Locked"]]} />
      </div>
      <Panel>
        <Table head={["Site", "Owner", "Status", "Last checked", "SSL", "Domain", "Last alert"]} empty={rows.length === 0} emptyText={q || status ? "No sites match." : "No sites yet."}>
          {rows.map((s) => {
            const a = s.alertLogs[0];
            return (
              <tr key={s.id} className="hover:bg-accent-soft/40">
                <td className={td}>
                  <Link href={`/admin/sites${qs(base, { s: s.id })}`} scroll={false} className="block max-w-[14rem] hover:text-accent">
                    <span className={`block truncate text-ink ${isNew(s.createdAt) || isNew(s.alertDownAt) ? "font-semibold" : "font-medium"}`}><NewDot on={isNew(s.createdAt) || isNew(s.alertDownAt)} />{s.name}</span>
                    <span className="block truncate text-xs text-muted">{s.url.replace(/^https?:\/\//, "")}</span>
                  </Link>
                </td>
                <td className={`${td} max-w-[12rem] truncate text-muted`}>{s.user.email}</td>
                <td className={td}><SiteStatus status={s.status} locked={s.locked} /></td>
                <td className={`${td} whitespace-nowrap text-muted`}>{s.lastCheckedAt ? fmtDate(s.lastCheckedAt) : "Never"}</td>
                <td className={td}><Days n={s.sslDaysLeft} /></td>
                <td className={td}><Days n={s.domainDaysLeft} /></td>
                <td className={`${td} whitespace-nowrap text-muted`}>
                  {a ? <>{a.kind} · {fmtDate(a.createdAt, false)}{!a.sent && <span className="text-danger"> · not sent</span>}</> : s.alertDownAt ? `down · ${fmtDate(s.alertDownAt, false)}` : "—"}
                </td>
              </tr>
            );
          })}
        </Table>
        <Pager path="/admin/sites" q={base} page={page} total={total} />
      </Panel>
      {sp.s && <SiteDrawer id={sp.s} close={close} />}
    </div>
  );
}
