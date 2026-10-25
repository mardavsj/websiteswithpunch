"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Balances } from "@/lib/referrals/ledger";
import { REFERRAL, fmtUsd } from "@/lib/referrals/config";

/** Three numbers + inline Withdraw. The server re-checks every rule; this is just the UI. */
export function Earnings({ balances: b, hasMethod, hasOpenRequest }: { balances: Balances; hasMethod: boolean; hasOpenRequest: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const short = Math.max(0, REFERRAL.minPayoutCents - b.withdrawable);

  let hint: string | null = null;
  if (hasOpenRequest || done) hint = `${fmtUsd(b.requested)} payout in review`;
  else if (short > 0) hint = `${fmtUsd(short)} to go`;
  else if (!hasMethod) hint = "Add a payout method first";

  async function withdraw() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/referrals/withdraw", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't request the payout.");
      setDone(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't request the payout.");
    } finally {
      setBusy(false);
    }
  }

  const stats = [
    { label: "Available", value: b.withdrawable },
    { label: "In review", value: b.requested },
    { label: "Paid", value: b.paid },
  ];

  return (
    <section className="border border-rule bg-surface">
      <div className="flex flex-col sm:flex-row sm:items-center">
        <dl className="grid flex-1 grid-cols-3 divide-x divide-rule">
          {stats.map((s) => (
            <div key={s.label} className="min-w-0 px-4 py-3">
              <dt className="text-xs text-muted">{s.label}</dt>
              <dd className="mt-0.5 truncate font-display text-lg font-medium tabular-nums text-ink sm:text-xl">{fmtUsd(s.value)}</dd>
            </div>
          ))}
        </dl>
        <div className="flex items-center justify-between gap-3 border-t border-rule px-4 py-3 sm:flex-col sm:items-end sm:border-l sm:border-t-0">
          <button
            type="button"
            onClick={withdraw}
            disabled={Boolean(hint) || busy}
            className="order-2 shrink-0 bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 sm:order-1"
          >
            {busy ? "Requesting…" : "Withdraw"}
          </button>
          {hint && <p className="order-1 text-xs text-muted sm:order-2">{hint}</p>}
        </div>
      </div>
      {(error || b.owed > 0) && (
        <div className="border-t border-rule px-4 py-2 text-xs">
          {error && <p className="text-danger" role="alert">{error}</p>}
          {b.owed > 0 && <p className="text-muted">{fmtUsd(b.owed)} from refunded payments comes off your next payout.</p>}
        </div>
      )}
    </section>
  );
}
