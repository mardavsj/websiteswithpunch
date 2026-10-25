"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Balances } from "@/lib/referrals/ledger";
import { REFERRAL, fmtUsd } from "@/lib/referrals/config";

const TILES: Array<{ key: keyof Balances; label: string; sub: string; dot: string }> = [
  { key: "pending", label: "On hold", sub: `${REFERRAL.holdDays}-day refund window`, dot: "bg-amber-500" },
  { key: "available", label: "Available", sub: "Ready to withdraw", dot: "bg-emerald-500" },
  { key: "requested", label: "Requested", sub: "Payout in review", dot: "bg-accent" },
  { key: "paid", label: "Paid out", sub: "Sent to you", dot: "bg-muted/60" },
];

/** Balances by status + the withdraw action. The server re-checks every rule; this is just the UI. */
export function Earnings({ balances: b, hasMethod, hasOpenRequest }: { balances: Balances; hasMethod: boolean; hasOpenRequest: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const min = REFERRAL.minPayoutCents;
  const short = Math.max(0, min - b.withdrawable);

  let blocker: string | null = null;
  if (hasOpenRequest || done) blocker = "Your payout request is in review. We usually pay within 5 business days.";
  else if (!hasMethod) blocker = "Add a PayPal email or UPI ID below to withdraw.";
  else if (short > 0) blocker = `${fmtUsd(short)} more to reach the ${fmtUsd(min)} minimum.`;

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

  return (
    <section className="border border-rule bg-surface">
      <header className="flex items-center justify-between gap-3 border-b border-rule px-4 py-2.5">
        <h3 className="label-caps !text-ink/80">Earnings</h3>
        <span className="text-xs text-muted">USD</span>
      </header>
      <div className="grid grid-cols-2 gap-px bg-rule sm:grid-cols-4">
        {TILES.map((t) => (
          <div key={t.key} className="min-w-0 bg-surface px-4 py-3">
            <p className="flex items-center gap-1.5 label-caps">
              <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} aria-hidden />
              {t.label}
            </p>
            <p className="mt-1 font-display text-xl font-medium tabular-nums text-ink">{fmtUsd(b[t.key])}</p>
            <p className="mt-0.5 text-xs text-muted">{t.sub}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 border-t border-rule px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-ink">
            You can withdraw <span className="font-medium tabular-nums">{fmtUsd(b.withdrawable)}</span>
          </p>
          {b.owed > 0 && (
            <p className="mt-0.5 text-xs text-muted">{fmtUsd(b.owed)} from refunded payments is deducted from your next payout.</p>
          )}
          {blocker && <p className="mt-0.5 text-xs text-muted">{blocker}</p>}
          {error && <p className="mt-1 text-xs text-danger" role="alert">{error}</p>}
        </div>
        <button
          type="button"
          onClick={withdraw}
          disabled={Boolean(blocker) || busy}
          className="shrink-0 bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Requesting…" : `Withdraw ${fmtUsd(b.withdrawable)}`}
        </button>
      </div>
    </section>
  );
}
