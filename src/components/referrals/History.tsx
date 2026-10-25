import { fmtUsd } from "@/lib/referrals/config";
import { fmtDate, type CommissionRow, type PayoutRow } from "./types";

type Line = { id: string; at: string; what: string; note: string; status: string; tone: string; cents: number; strike?: boolean };

const C: Record<string, [string, string]> = {
  pending: ["Available", "text-emerald-600 dark:text-emerald-400"], // legacy hold rows
  available: ["Available", "text-emerald-600 dark:text-emerald-400"],
  requested: ["Requested", "text-muted"],
  paid: ["Paid", "text-muted"],
  reversed: ["Reversed", "text-danger"],
};
const P: Record<string, [string, string]> = {
  requested: ["In review", "text-accent"],
  paid: ["Sent", "text-emerald-600 dark:text-emerald-400"],
  rejected: ["Rejected", "text-danger"],
};

function lines(rows: CommissionRow[], payouts: PayoutRow[]): Line[] {
  const c = rows.map((r): Line => {
    const [status, tone] = C[r.status] ?? C.available;
    const note =
      r.status === "reversed" ? (r.clawback ? "Refunded after payout" : r.reversedReason || "Refunded or disputed")
      : `of a ${fmtUsd(r.baseCents)} payment`;
    return { id: r.id, at: r.createdAt, what: "Commission", note, status, tone, cents: r.amountCents, strike: r.status === "reversed" };
  });
  const p = payouts.map((x): Line => {
    const [status, tone] = P[x.status] ?? P.requested;
    const note = x.status === "paid" && x.reference ? `Ref ${x.reference}` : x.status === "rejected" ? x.reason ?? "" : x.address;
    return { id: x.id, at: x.createdAt, what: `Payout · ${x.method === "upi" ? "UPI" : "PayPal"}`, note, status, tone, cents: -x.amountCents };
  });
  return [...c, ...p].sort((a, b) => b.at.localeCompare(a.at));
}

/** Commissions and payouts in one list. Referred customers stay anonymous. */
export function History({ rows, payouts, clicks, signups, paying }: { rows: CommissionRow[]; payouts: PayoutRow[]; clicks: number; signups: number; paying: number }) {
  const all = lines(rows, payouts);
  return (
    <section className="border border-rule bg-surface">
      <header className="flex items-center justify-between gap-3 border-b border-rule px-4 py-2.5">
        <h3 className="text-sm font-medium text-ink">History</h3>
        <span className="text-xs tabular-nums text-muted">{clicks} visits · {signups} signups · {paying} paying</span>
      </header>
      {all.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-ink">Nothing here yet</p>
          <p className="mt-1 text-xs text-muted">When someone you refer pays, it shows up here.</p>
        </div>
      ) : (
        <ul className="divide-y divide-rule">
          {all.map((l) => (
            <li key={l.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink">
                  {l.what} <span className="text-muted">· {fmtDate(l.at)}</span>
                </p>
                <p className="truncate text-xs text-muted">{l.note}</p>
              </div>
              <span className={`hidden text-xs sm:inline ${l.tone}`}>{l.status}</span>
              <div className="w-20 shrink-0 text-right">
                <p className={`text-sm font-medium tabular-nums ${l.strike ? "text-muted line-through" : "text-ink"}`}>
                  {l.cents < 0 ? `−${fmtUsd(-l.cents)}` : fmtUsd(l.cents)}
                </p>
                <p className={`text-xs sm:hidden ${l.tone}`}>{l.status}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
