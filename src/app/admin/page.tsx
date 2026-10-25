import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import { newCounts } from "@/lib/admin/seen";
import { NewPill } from "@/components/admin/NewPill";
import { overviewStats } from "@/lib/admin/overview";
import { fmtUsd } from "@/lib/referrals/config";
import { AdminHeader, Badge, Panel, Stat, fmtDate } from "@/components/admin/ui";

export const metadata = { title: "Overview" };

const n = (v: number) => v.toLocaleString("en-US");

export default async function AdminOverview() {
  const admin = await requireAdmin();
  const fresh = await newCounts(admin.email!, ["payouts:requested", "sites:down", "sites:ssl", "sites:domain", "messages:open"]);
  const s = await overviewStats();
  return (
    <div className="space-y-6">
      <AdminHeader title="Overview" sub="Live numbers from the database." />
      <Attention s={s} fresh={fresh} />
      <div className="grid grid-cols-2 gap-px border border-rule bg-rule lg:grid-cols-4">
        <Stat href="/admin/users" label="Users" value={n(s.users)} note={`${n(s.verified)} verified`} />
        <Stat href="/admin/users?plan=paid" label="Paying" value={n(s.pro + s.business)} note={`Pro ${n(s.pro)} · Business ${n(s.business)}`} />
        <Stat label="MRR (estimated)" value={`$${n(s.mrr)}`} note="Current plans at monthly list price" />
        <Stat href="/admin/sites?status=monitored" label="Sites monitored" value={n(s.sites)} note={s.down ? <span className="text-danger">{n(s.down)} down now</span> : "None down"} />
        <Stat href="/admin/payouts?tab=requested" label="Payouts pending" value={n(s.openPayouts)} note={`${fmtUsd(s.openPayoutCents)} to pay`} />
        <Stat href="/admin/referrals?status=available" label="Commissions available" value={fmtUsd(s.availableCents)} note={`${n(s.availableCount)} commission${s.availableCount === 1 ? "" : "s"}, not yet requested`} />
        <Stat href="/admin/alerts?sent=yes&range=7d" label="Alerts sent (7 days)" value={n(s.alerts)} note="Down, recovery, SSL, domain" />
        <Stat href="/admin/messages?state=all&range=7d" label="Messages (7 days)" value={n(s.messages)} note={`${n(s.unread)} open`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Recent signups" action={<Link href="/admin/users" className="text-xs text-accent hover:underline">All users</Link>}>
          {s.signups.length === 0 ? <p className="px-4 py-6 text-sm text-muted">No users yet.</p> : (
            <ul className="divide-y divide-rule">
              {s.signups.map((u) => (
                <li key={u.id}>
                  <Link href={`/admin/users?u=${u.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent-soft">
                    <span className="min-w-0 flex-1 truncate text-sm text-ink">{u.email}</span>
                    <Badge tone={u.plan === "free" ? "muted" : "accent"}>{u.plan}</Badge>
                    <span className="hidden shrink-0 text-xs text-muted sm:inline">{fmtDate(u.createdAt, false)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Recent activity" action={<Link href="/admin/audit" className="text-xs text-accent hover:underline">Audit log</Link>}>
          {s.activity.length === 0 ? <p className="px-4 py-6 text-sm text-muted">No audited actions yet.</p> : (
            <ul className="divide-y divide-rule">
              {s.activity.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink">{a.action}</span>
                  <span className="shrink-0 text-xs text-muted">{fmtDate(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

type S = Awaited<ReturnType<typeof overviewStats>>;

/** Only what needs a human: open payouts, changed amounts, sites down, unanswered messages. */
function Attention({ s, fresh }: { s: S; fresh: Record<string, number> }) {
  const items: Array<{ key: string; href: string; text: React.ReactNode; danger?: boolean; fresh?: number }> = [];
  if (s.openPayouts) items.push({ key: "p", fresh: fresh["payouts:requested"], href: "/admin/payouts?tab=requested", text: <>{n(s.openPayouts)} payout request{s.openPayouts === 1 ? "" : "s"} · <b className="font-medium tabular-nums">{fmtUsd(s.openPayoutCents)}</b> to pay</> });
  for (const p of s.changed) items.push({ key: `c${p.id}`, href: `/admin/payouts?p=${p.id}`, danger: true, text: <>Amount changed for {p.user.email}: was {fmtUsd(p.requestedCents ?? 0)}, now <b className="font-medium">{fmtUsd(p.amountCents)}</b></> });
  if (s.down) items.push({ key: "d", fresh: fresh["sites:down"], href: "/admin/sites?status=down", danger: true, text: <>{n(s.down)} site{s.down === 1 ? "" : "s"} down: {s.downList.map((d) => d.name).join(", ")}{s.down > s.downList.length ? "…" : ""}</> });
  if (s.ssl) items.push({ key: "s", fresh: fresh["sites:ssl"], href: "/admin/sites?status=ssl", text: <>{n(s.ssl)} SSL certificate{s.ssl === 1 ? "" : "s"} expiring within 30 days</> });
  if (s.domain) items.push({ key: "o", fresh: fresh["sites:domain"], href: "/admin/sites?status=domain", text: <>{n(s.domain)} domain{s.domain === 1 ? "" : "s"} expiring within 30 days</> });
  if (s.unread) items.push({ key: "m", fresh: fresh["messages:open"], href: "/admin/messages", text: <>{n(s.unread)} open message{s.unread === 1 ? "" : "s"}</> });
  return (
    <Panel title="Needs attention">
      {items.length === 0 ? <p className="px-4 py-4 text-sm text-muted">All clear. Nothing waiting on you.</p> : (
        <ul className="divide-y divide-rule">
          {items.map((i) => (
            <li key={i.key}>
              <Link href={i.href} className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent-soft ${i.danger ? "text-danger" : "text-ink"} ${(i.fresh ?? 0) > 0 ? `font-semibold shadow-[inset_2px_0_0_#059669] ${i.danger ? "" : "!text-zinc-900 dark:!text-white"}` : ""}`}>
                <span className={`h-2 w-2 shrink-0 rounded-full ${i.danger ? "bg-danger" : "bg-accent"}`} />
                <span className="min-w-0 flex-1">{i.text}</span>
                <NewPill n={i.fresh ?? 0} />
                <span aria-hidden className="text-muted">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
