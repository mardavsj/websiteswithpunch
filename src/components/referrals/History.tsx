import { fmtUsd } from "@/lib/referrals/config";
import { Chip, type Tone } from "@/components/details/ui";
import { fmtDate, type CommissionRow, type PayoutRow } from "./types";

const C_STATUS: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "On hold", tone: "warn" },
  available: { label: "Available", tone: "ok" },
  requested: { label: "Requested", tone: "accent" },
  paid: { label: "Paid", tone: "neutral" },
  reversed: { label: "Reversed", tone: "bad" },
};
const P_STATUS: Record<string, { label: string; tone: Tone }> = {
  requested: { label: "In review", tone: "accent" },
  paid: { label: "Paid", tone: "ok" },
  rejected: { label: "Rejected", tone: "bad" },
};

function note(r: CommissionRow) {
  if (r.status === "pending") return `Available ${fmtDate(r.availableAt)}`;
  if (r.status === "reversed") return r.clawback ? "Refunded after payout, deducted next time" : r.reversedReason || "Payment refunded or disputed";
  return `${fmtUsd(r.baseCents)} payment`;
}

/** Every commission and payout. Referred customers stay anonymous (no names or emails shown). */
export function History({ rows, payouts }: { rows: CommissionRow[]; payouts: PayoutRow[] }) {
  return (
    <>
      <section className="border border-rule bg-surface">
        <header className="flex items-center justify-between border-b border-rule px-4 py-2.5">
          <h3 className="label-caps !text-ink/80">Commission history</h3>
          <span className="text-xs tabular-nums text-muted">{rows.length}</span>
        </header>
        {rows.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted">No commissions yet. They appear here as soon as someone you referred pays.</p>
        ) : (
          <ul className="divide-y divide-rule">
            {rows.map((r) => {
              const s = C_STATUS[r.status] ?? C_STATUS.pending;
              return (
                <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink">{fmtDate(r.createdAt)}</p>
                    <p className="truncate text-xs text-muted">{note(r)}</p>
                  </div>
                  <Chip tone={s.tone}>{s.label}</Chip>
                  <p className={`w-20 shrink-0 text-right text-sm font-medium tabular-nums ${r.status === "reversed" ? "text-muted line-through" : "text-ink"}`}>
                    {fmtUsd(r.amountCents)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {payouts.length > 0 && (
        <section className="border border-rule bg-surface">
          <header className="border-b border-rule px-4 py-2.5">
            <h3 className="label-caps !text-ink/80">Payouts</h3>
          </header>
          <ul className="divide-y divide-rule">
            {payouts.map((p) => {
              const s = P_STATUS[p.status] ?? P_STATUS.requested;
              return (
                <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink">
                      {fmtDate(p.createdAt)} · {p.method === "upi" ? "UPI" : "PayPal"}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {p.status === "paid" && p.reference ? `Ref ${p.reference}` : p.status === "rejected" ? p.reason : p.address}
                    </p>
                  </div>
                  <Chip tone={s.tone}>{s.label}</Chip>
                  <p className="w-20 shrink-0 text-right text-sm font-medium tabular-nums text-ink">{fmtUsd(p.amountCents)}</p>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}
