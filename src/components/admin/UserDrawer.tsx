import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmtUsd } from "@/lib/referrals/config";
import { referrerTotals } from "@/lib/admin/referrer";
import { Badge, fmtDate } from "./ui";

/** Server-rendered side panel (opened by ?u=ID, closed by a link): no client state to mismatch. */
export async function UserDrawer({ id, close }: { id: string; close: string }) {
  const u = await prisma.user.findUnique({
    where: { id: id.slice(0, 40) },
    select: {
      email: true, name: true, plan: true, sitePackCount: true, dodoStatus: true, dodoSubscriptionId: true, dodoCustomerId: true,
      cancelAtPeriodEnd: true, createdAt: true, referralCode: true, payoutMethod: true, payoutAddress: true,
      referredBy: { select: { email: true } },
      sites: { orderBy: { createdAt: "asc" }, take: 100, select: { id: true, name: true, url: true, status: true, locked: true } },
      commissionsEarned: { orderBy: { createdAt: "desc" }, take: 20, select: { id: true, amountCents: true, status: true, createdAt: true, clawback: true, referredUser: { select: { email: true } } } },
      payouts: { orderBy: { createdAt: "desc" }, take: 20, select: { id: true, amountCents: true, status: true, createdAt: true, method: true } },
    },
  });
  const t = u ? (await referrerTotals([id.slice(0, 40)])).get(id.slice(0, 40)) : undefined;
  const row = (k: string, v: React.ReactNode) => (
    <div className="flex gap-3 py-1.5 text-sm"><dt className="w-32 shrink-0 text-muted">{k}</dt><dd className="min-w-0 break-all text-ink">{v || "—"}</dd></div>
  );
  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <Link href={close} aria-label="Close details" className="absolute inset-0 bg-black/30" scroll={false} />
      <aside role="dialog" aria-label="User details" className="relative h-full w-full max-w-md overflow-y-auto border-l border-rule bg-surface p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="label-caps">User</p>
            <h2 className="mt-1 break-all font-display text-lg font-medium text-ink">{u?.email ?? "Not found"}</h2>
          </div>
          <Link href={close} scroll={false} className="border border-rule px-2.5 py-1 text-sm text-ink hover:border-accent">Close</Link>
        </div>
        {u && (
          <>
            <dl className="mt-4 divide-y divide-rule border-y border-rule">
              {row("Name", u.name)}
              {row("Plan", <><Badge tone={u.plan === "free" ? "muted" : "accent"}>{u.plan}</Badge>{u.sitePackCount ? ` + ${u.sitePackCount} pack(s)` : ""}{u.cancelAtPeriodEnd ? " · cancels at period end" : ""}</>)}
              {row("Billing status", u.dodoStatus)}
              {row("Subscription", u.dodoSubscriptionId && <span className="font-mono text-xs">{u.dodoSubscriptionId}</span>)}
              {row("Customer", u.dodoCustomerId && <span className="font-mono text-xs">{u.dodoCustomerId}</span>)}
              {row("Joined", fmtDate(u.createdAt))}
              {row("Referred by", u.referredBy?.email)}
              {row("Referral code", u.referralCode && <span className="font-mono text-xs">{u.referralCode}</span>)}
              {row("Payout to", u.payoutAddress && `${u.payoutMethod === "upi" ? "UPI" : "PayPal"} · ${u.payoutAddress}`)}
            </dl>
            <h3 className="label-caps mt-6">Sites ({u.sites.length})</h3>
            <ul className="mt-2 divide-y divide-rule border-y border-rule">
              {u.sites.length === 0 && <li className="py-2 text-sm text-muted">No sites.</li>}
              {u.sites.map((s) => (
                <li key={s.id} className="flex items-center gap-2 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate text-ink" title={s.url}>{s.name}</span>
                  {s.locked ? <Badge>locked</Badge> : <Badge tone={s.status === "up" ? "ok" : s.status === "down" || s.status === "error" ? "danger" : "muted"}>{s.status}</Badge>}
                </li>
              ))}
            </ul>
            {t && (
              <>
                <h3 className="label-caps mt-6">Referral balance</h3>
                <div className="mt-2 grid grid-cols-3 gap-px border border-rule bg-rule text-center">
                  {([["Available", t.withdrawable], ["Requested", t.requested], ["Paid", t.paid]] as const).map(([k, v]) => (
                    <div key={k} className="bg-surface px-2 py-2.5"><p className="text-[11px] text-muted">{k}</p><p className="font-medium tabular-nums text-ink">{fmtUsd(v)}</p></div>
                  ))}
                </div>
                {t.owed > 0 && <p className="mt-1.5 text-xs text-danger">{fmtUsd(t.owed)} owed back (refunded after payout), deducted from the next payout.</p>}
                {t.mismatched.length > 0 && <p className="mt-1.5 text-xs text-danger">A payout doesn&apos;t match its commissions. Open it before paying.</p>}
              </>
            )}
            <h3 className="label-caps mt-6">Payouts</h3>
            <ul className="mt-2 divide-y divide-rule border-y border-rule">
              {u.payouts.length === 0 && <li className="py-2 text-sm text-muted">None.</li>}
              {u.payouts.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/payouts?tab=all&p=${p.id}`} className="flex items-center gap-2 py-2 text-sm hover:text-accent">
                    <span className="flex-1 text-muted">{fmtDate(p.createdAt, false)} · {p.method === "upi" ? "UPI" : "PayPal"}</span>
                    <Badge tone={p.status === "paid" ? "ok" : p.status === "requested" ? "accent" : "muted"}>{p.status}</Badge>
                    <span className="w-20 text-right tabular-nums text-ink">{fmtUsd(p.amountCents)}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <h3 className="label-caps mt-6">Commissions earned</h3>
            <ul className="mt-2 divide-y divide-rule border-y border-rule">
              {u.commissionsEarned.length === 0 && <li className="py-2 text-sm text-muted">None.</li>}
              {u.commissionsEarned.map((c) => (
                <li key={c.id} className="flex items-center gap-2 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate text-muted">{fmtDate(c.createdAt, false)} · {c.referredUser?.email ?? "deleted user"}</span>
                  <Badge tone={c.status === "paid" ? "ok" : c.status === "reversed" ? "danger" : c.status === "requested" ? "accent" : "muted"}>{c.status === "pending" ? "available" : c.status}{c.clawback ? " · owed" : ""}</Badge>
                  <span className="w-20 text-right tabular-nums text-ink">{fmtUsd(c.amountCents)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </aside>
    </div>
  );
}
