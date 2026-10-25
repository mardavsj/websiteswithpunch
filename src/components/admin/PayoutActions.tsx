"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CopyText } from "./CopyText";

type Props = { id: string; cents: number; amount: string; method: string; address: string; upi: boolean; blocked: boolean };

/** Mark paid / Reject, each behind a confirm dialog that repeats the exact amount and address. */
export function PayoutActions({ id, cents, amount, method, address, upi, blocked }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<null | "paid" | "reject">(null);
  const [text, setText] = useState("");
  const [inr, setInr] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mode) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && !busy && setMode(null);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [mode, busy]);

  const open = (m: "paid" | "reject") => { setMode(m); setText(""); setInr(""); setError(null); };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const v = text.trim();
    if (mode === "paid" && v.length < 3) return setError("Add the transaction ID from PayPal or your UPI app.");
    if (mode === "paid" && inr.trim() && !/^\d{1,9}(\.\d{1,2})?$/.test(inr.replace(/,/g, "").trim())) return setError("INR amount must be a number like 2000 or 1999.50.");
    if (mode === "reject" && v.length < 5) return setError("Give a reason (the user sees it).");
    setBusy(true);
    setError(null);
    try {
      const body = mode === "paid" ? { action: "paid", reference: v, expectedCents: cents, ...(inr.trim() && { inr: inr.replace(/,/g, "").trim() }) } : { action: "reject", reason: v };
      const res = await fetch(`/api/admin/payouts/${encodeURIComponent(id)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't update the payout.");
      setMode(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update the payout.");
    } finally {
      setBusy(false);
    }
  }

  const field = `w-full border bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus:outline-none ${error ? "border-danger" : "border-rule focus:border-accent"}`;
  return (
    <>
      <div className="flex gap-2">
        <button type="button" disabled={blocked} onClick={() => open("paid")} className="flex-1 bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50">Mark paid…</button>
        <button type="button" onClick={() => open("reject")} className="border border-danger/40 px-4 py-2.5 text-sm font-medium text-danger hover:bg-danger/5">Reject…</button>
      </div>
      {blocked && <p className="mt-1.5 text-xs text-danger">Mark paid is disabled until the amount checks out.</p>}
      {mode && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button type="button" aria-label="Cancel" onClick={() => !busy && setMode(null)} className="absolute inset-0 bg-black/40" />
          <form onSubmit={submit} noValidate role="dialog" aria-modal="true" aria-label={mode === "paid" ? "Confirm payment" : "Reject payout"} className="relative w-full max-w-sm border border-rule bg-surface p-5 shadow-xl">
            <h3 className="font-display text-lg font-medium text-ink">{mode === "paid" ? "Confirm you sent" : "Reject this request"}</h3>
            <p className="mt-2 font-display text-3xl font-medium tabular-nums text-ink">{amount}</p>
            <div className="mt-2 text-sm"><span className="label-caps mr-2">{method}</span><CopyText value={address} /></div>
            {mode === "paid" ? (
              <>
                <label htmlFor="pay-ref" className="mt-4 block text-xs font-medium text-muted">Transaction ID (required)</label>
                <input id="pay-ref" autoFocus value={text} maxLength={120} onChange={(e) => { setText(e.target.value); setError(null); }} placeholder={upi ? "UPI ref, e.g. 412345678901" : "e.g. 8XK12345AB678901C"} className={`${field} mt-1`} />
                {upi && (
                  <>
                    <label htmlFor="pay-inr" className="mt-3 block text-xs font-medium text-muted">INR sent (optional)</label>
                    <input id="pay-inr" inputMode="decimal" value={inr} maxLength={16} onChange={(e) => { setInr(e.target.value); setError(null); }} placeholder="e.g. 1810.50" className={`${field} mt-1`} />
                  </>
                )}
              </>
            ) : (
              <>
                <label htmlFor="rej-reason" className="mt-4 block text-xs font-medium text-muted">Reason (the user sees this)</label>
                <input id="rej-reason" autoFocus value={text} maxLength={300} onChange={(e) => { setText(e.target.value); setError(null); }} placeholder="e.g. Self-referral detected" className={`${field} mt-1`} />
                <p className="mt-1.5 text-xs text-muted">The commissions go back to the user&apos;s available balance.</p>
              </>
            )}
            {error && <p className="mt-2 text-xs text-danger" role="alert">{error}</p>}
            <div className="mt-5 flex gap-2">
              <button type="button" disabled={busy} onClick={() => setMode(null)} className="flex-1 border border-rule px-4 py-2 text-sm font-medium text-ink hover:border-accent">Cancel</button>
              <button type="submit" disabled={busy} className={`flex-1 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${mode === "paid" ? "bg-accent hover:bg-accent-hover" : "bg-danger hover:opacity-90"}`}>
                {busy ? "Saving…" : mode === "paid" ? "Confirm paid" : "Reject"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
