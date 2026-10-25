import { viewSection } from "@/lib/admin/seen";
import { SeenRefresh } from "@/components/admin/SeenRefresh";
import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/guard";
import { NewDot, NewPill, AdminHeader, Badge, PAGE_SIZE, Pager, Panel, Table, fmtDate, pageOf, qs, td } from "@/components/admin/ui";
import { payoutsWhere } from "@/lib/admin/filters";
import { PayoutDrawer } from "@/components/admin/PayoutDrawer";
import { fmtUsd } from "@/lib/referrals/config";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Payouts" };

const TABS = [["requested", "Requested"], ["paid", "Paid"], ["rejected", "Rejected"], ["all", "All"]] as const;
type Search = { tab?: string; q?: string; sort?: string; page?: string; p?: string };

/** ADMIN_EMAILS only; everyone else gets a plain 404. Opened by ?p=ID for the detail drawer. */
export default async function AdminPayoutsPage({ searchParams: sp }: { searchParams: Search }) {
  const admin = await requireAdmin();
  const tab = TABS.some(([t]) => t === sp.tab) ? sp.tab! : "requested";
  const q = (sp.q ?? "").trim().slice(0, 100);
  const sort = sp.sort === "old" ? "old" : sp.sort === "new" ? "new" : tab === "requested" ? "old" : "new";
  const page = pageOf(sp.page);
  const where: Prisma.PayoutWhereInput = payoutsWhere({ tab, q });
  const [groups, total, sum, rows] = await Promise.all([
    prisma.payout.groupBy({ by: ["status"], _count: true }),
    prisma.payout.count({ where }),
    prisma.payout.aggregate({ where, _sum: { amountCents: true } }),
    prisma.payout.findMany({
      where, orderBy: { createdAt: sort === "old" ? "asc" : "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      include: { user: { select: { email: true } } },
    }),
  ]);
  const count = (s: string) => (s === "all" ? groups.reduce((n, g) => n + g._count, 0) : groups.find((g) => g.status === s)?._count ?? 0);
  const seen = await viewSection(admin.email!, ["payouts:requested", "payouts:paid", "payouts:rejected", "payouts:all"], [`payouts:${tab}`]);
  const isNew = (d: Date | null | undefined) => Boolean(d && d > seen.since);
  const base = { tab: tab === "requested" ? undefined : tab, q: q || undefined, sort: sp.sort, page: sp.page };
  const sumLabel = { requested: "to pay", paid: "paid", rejected: "rejected", all: "all statuses" }[tab];

  return (
    <div className="space-y-4">
      <SeenRefresh on={seen.refresh} />
      <AdminHeader title="Payouts" sub="Send the money from your PayPal or UPI app first, then mark it paid with the transaction ID." />

      <nav aria-label="Payout status" className="flex flex-wrap gap-1.5 text-sm">
        {TABS.map(([t, label]) => {
          const on = t === tab;
          const n = count(t);
          return (
            <Link key={t} href={`/admin/payouts${qs({ q: q || undefined }, { tab: t === "requested" ? undefined : t })}`} aria-current={on ? "page" : undefined}
              className={`flex items-center gap-2 border px-3 py-1.5 ${on ? "border-accent bg-accent text-white" : "border-rule bg-surface text-muted hover:border-accent hover:text-ink"}`}>
              {label}
              {(t === "requested" ? n > 0 : true) && <span className={`px-1.5 text-[11px] font-semibold tabular-nums ${on ? "bg-white/20" : t === "requested" ? "bg-accent text-white" : "bg-rule/60 text-ink"}`}>{n}</span>}
              <NewPill n={seen.counts[`payouts:${t}`] ?? 0} />
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form action="/admin/payouts" className="flex min-w-0 flex-1 gap-2 sm:max-w-sm">
          {base.tab && <input type="hidden" name="tab" value={base.tab} />}
          <label htmlFor="payout-q" className="sr-only">Search by email</label>
          <input id="payout-q" name="q" defaultValue={q} placeholder="Search by email" className="min-w-0 flex-1 border border-rule bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none" />
          <button className="border border-rule px-3 py-2 text-sm font-medium text-ink hover:border-accent hover:text-accent">Search</button>
        </form>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted">Sort:</span>
          {(["new", "old"] as const).map((s) => (
            <Link key={s} href={`/admin/payouts${qs(base, { sort: s, page: undefined })}`} aria-current={sort === s ? "true" : undefined} className={sort === s ? "font-medium text-accent" : "text-muted hover:text-ink"}>
              {s === "new" ? "Newest" : "Oldest"}
            </Link>
          ))}
        </div>
      </div>

      <Panel title={`${count(tab)} ${tab === "all" ? "payouts" : tab}${q ? ` matching “${q}”` : ""}`} action={<span className="text-sm font-medium tabular-nums text-ink">{fmtUsd(sum._sum.amountCents ?? 0)} <span className="font-normal text-muted">{sumLabel}</span></span>}>
        <Table head={["Requested", "User", "Method", "Amount", "Status", "Decided"]} empty={rows.length === 0}>
          {rows.map((p) => {
            const changed = p.requestedCents != null && p.requestedCents !== p.amountCents;
            return (
              <tr key={p.id} className="hover:bg-accent-soft">
                <td className={`${td} text-muted`}><NewDot on={isNew(p.createdAt) || isNew(p.amountChangedAt) || isNew(p.decidedAt)} />{fmtDate(p.createdAt)}</td>
                <td className={`${td} max-w-[240px] truncate`}><Link href={`/admin/payouts${qs(base, { p: p.id })}`} scroll={false} className="hover:text-accent">{p.user.email}</Link></td>
                <td className={`${td} text-muted`}>{p.method === "upi" ? "UPI" : "PayPal"}</td>
                <td className={`${td} font-medium tabular-nums`}>
                  <Link href={`/admin/payouts${qs(base, { p: p.id })}`} scroll={false} className="hover:text-accent">{fmtUsd(p.amountCents)}</Link>
                  {changed && <span className="ml-2"><Badge tone="danger">changed</Badge></span>}
                </td>
                <td className={td}><Badge tone={p.status === "paid" ? "ok" : p.status === "requested" ? "accent" : "muted"}>{p.status}</Badge></td>
                <td className={`${td} text-muted`}>{p.decidedAt ? fmtDate(p.decidedAt) : "—"}</td>
              </tr>
            );
          })}
        </Table>
        <Pager path="/admin/payouts" q={base} page={page} total={total} />
      </Panel>
      {sp.p && <PayoutDrawer id={sp.p} close={`/admin/payouts${qs(base, {})}`} />}
    </div>
  );
}
