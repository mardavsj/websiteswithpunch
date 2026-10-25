import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmtUsd, ratePercent } from "@/lib/referrals/config";
import { breakdown, fmtInr } from "@/lib/referrals/breakdown";
import { Badge, fmtDate } from "./ui";
import { CopyText } from "./CopyText";
import { PayoutActions } from "./PayoutActions";

const sel = { id: true, status: true, amountCents: true, baseCents: true, clawback: true, payoutId: true, clawbackPayoutId: true, paymentId: true, createdAt: true, reversedReason: true, referredUser: { select: { email: true } } } as const;

/** Server-rendered payout detail (opened by ?p=ID): exact amount, what it is made of, and the actions. */
export async function PayoutDrawer({ id, close }: { id: string; close: string }) {
  const p = await prisma.payout.findUnique({ where: { id: id.slice(0, 40) }, include: { user: { select: { email: true } } } });
  const rows = p ? await prisma.commission.findMany({ where: { OR: [{ payoutId: p.id }, { clawbackPayoutId: p.id }] }, orderBy: { createdAt: "asc" }, select: sel }) : [];
  const b = p && breakdown(p.id, p.amountCents, rows);
  const byId = new Map(rows.map((r) => [r.id, r]));
  const changed = p && p.requestedCents != null && p.requestedCents !== p.amountCents;
  const method = p?.method === "upi" ? "UPI" : "PayPal";

  const line = (id: string, sign = "", struck = false) => {
    const r = byId.get(id)!;
    return (
      <li key={id + sign} className={`py-2.5 text-sm ${struck ? "opacity-60" : ""}`}>
        <div className="flex items-baseline justify-between gap-3">
          <span className={`min-w-0 truncate text-ink ${struck ? "line-through" : ""}`}>{r.referredUser?.email ?? "Deleted user"}</span>
          <span className={`shrink-0 font-medium tabular-nums ${sign ? "text-danger" : "text-ink"} ${struck ? "line-through" : ""}`}>{sign}{fmtUsd(r.amountCents)}</span>
        </div>
        <p className="mt-0.5 break-all text-xs text-muted">
          {fmtDate(r.createdAt, false)} · <span className="font-mono">{r.paymentId}</span> · plan {fmtUsd(r.baseCents)} pre-tax (packs excluded) × {ratePercent}%
          {r.reversedReason && ` · ${r.reversedReason}${struck ? " (removed before payment)" : " after payout"}`}
        </p>
      </li>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <Link href={close} aria-label="Close details" className="absolute inset-0 bg-black/30" scroll={false} />
      <aside role="dialog" aria-label="Payout details" className="relative h-full w-full max-w-lg overflow-y-auto border-l border-rule bg-surface p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="label-caps">Payout {p && <Badge tone={p.status === "paid" ? "ok" : p.status === "requested" ? "accent" : "muted"}>{p.status}</Badge>}</p>
            <h2 className="mt-1 break-all font-display text-lg font-medium text-ink">{p?.user.email ?? "Not found"}</h2>
          </div>
          <Link href={close} scroll={false} className="border border-rule px-2.5 py-1 text-sm text-ink hover:border-accent">Close</Link>
        </div>
        {p && b && (
          <>
            <div className="mt-4 border border-rule px-4 py-3">
              <p className="text-xs text-muted">{p.status === "paid" ? "Paid" : p.status === "rejected" ? "Was requested" : "Amount to send"}</p>
              <p className="font-display text-3xl font-medium tabular-nums text-ink" data-testid="payout-amount">{fmtUsd(p.amountCents)}</p>
              <p className="mt-0.5 text-xs text-muted">Requested {fmtDate(p.createdAt)}</p>
            </div>
            {changed && (
              <p role="alert" className="mt-3 border border-danger/40 px-3 py-2 text-sm text-danger">
                Amount changed: was {fmtUsd(p.requestedCents!)}, now {fmtUsd(p.amountCents)}{p.amountChangedAt ? ` (${fmtDate(p.amountChangedAt)})` : ""}. A refund or dispute removed a commission. Pay the new amount.
              </p>
            )}
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex gap-3"><dt className="w-20 shrink-0 text-muted">Method</dt><dd className="text-ink">{method}</dd></div>
              <div className="flex gap-3"><dt className="w-20 shrink-0 text-muted">{p.method === "upi" ? "UPI ID" : "PayPal"}</dt><dd className="min-w-0"><CopyText value={p.address} /></dd></div>
              <div className="flex gap-3"><dt className="w-20 shrink-0 text-muted">User</dt><dd className="min-w-0"><CopyText value={p.user.email} /></dd></div>
              {p.status === "paid" && <div className="flex gap-3"><dt className="w-20 shrink-0 text-muted">Reference</dt><dd className="min-w-0"><CopyText value={p.reference ?? ""} /></dd></div>}
              {p.paidInrPaise != null && <div className="flex gap-3"><dt className="w-20 shrink-0 text-muted">INR sent</dt><dd className="tabular-nums text-ink">{fmtInr(p.paidInrPaise)}</dd></div>}
              {p.status === "rejected" && <div className="flex gap-3"><dt className="w-20 shrink-0 text-muted">Reason</dt><dd className="text-ink">{p.reason}</dd></div>}
              {p.decidedAt && <div className="flex gap-3"><dt className="w-20 shrink-0 text-muted">Decided</dt><dd className="text-muted">{fmtDate(p.decidedAt)} by {p.decidedBy}</dd></div>}
            </dl>

            <h3 className="label-caps mt-6">Breakdown</h3>
            <ul className="mt-2 divide-y divide-rule border-y border-rule">
              {b.included.map((r) => line(r.id))}
              {b.removed.map((r) => line(r.id, "", true))}
              {b.deductions.map((r) => line(r.id, "−"))}
              {rows.length === 0 && <li className="py-2.5 text-sm text-muted">No commissions linked.</li>}
            </ul>
            <dl className="mt-2 space-y-1 text-sm tabular-nums">
              <div className="flex justify-between"><dt className="text-muted">Commissions ({b.included.length})</dt><dd className="text-ink">{fmtUsd(b.gross)}</dd></div>
              {b.deducted > 0 && <div className="flex justify-between"><dt className="text-muted">Earlier refunds recovered</dt><dd className="text-danger">−{fmtUsd(b.deducted)}</dd></div>}
              <div className="flex justify-between border-t border-rule pt-1 font-medium"><dt className="text-ink">Total</dt><dd className="text-ink">{fmtUsd(b.total)}</dd></div>
            </dl>
            {b.ok ? (
              <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">✓ Breakdown matches the payout amount.</p>
            ) : (
              <p role="alert" className="mt-2 border border-danger/40 px-3 py-2 text-sm font-medium text-danger">
                Mismatch: the lines add up to {fmtUsd(b.total)} but the payout says {fmtUsd(p.amountCents)}. Don&apos;t pay until this is checked.
              </p>
            )}
            {p.status === "requested" && <PayoutActions id={p.id} cents={p.amountCents} amount={fmtUsd(p.amountCents)} method={method} address={p.address} upi={p.method === "upi"} blocked={!b.ok || p.amountCents <= 0} />}
          </>
        )}
      </aside>
    </div>
  );
}
