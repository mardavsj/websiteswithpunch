"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

/** Mark paid (with the transaction reference) or reject (with a reason the user will see). */
export function PayoutDecision({ id }: { id: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"paid" | "reject">("paid");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const v = text.trim();
    if (mode === "paid" && v.length < 3) return setError("Add the PayPal or UPI transaction ID.");
    if (mode === "reject" && v.length < 5) return setError("Give a reason (the user sees it).");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/payouts/${encodeURIComponent(id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "paid" ? { action: "paid", reference: v } : { action: "reject", reason: v }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't update the payout.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update the payout.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3" noValidate>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={mode}
          onChange={(e) => { setMode(e.target.value as "paid" | "reject"); setError(null); }}
          aria-label="Decision"
          className="border border-rule bg-bg px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
        >
          <option value="paid">Mark paid</option>
          <option value="reject">Reject</option>
        </select>
        <input
          value={text}
          onChange={(e) => { setText(e.target.value); setError(null); }}
          maxLength={mode === "paid" ? 120 : 300}
          placeholder={mode === "paid" ? "Transaction ID, e.g. 8XK12345AB678901C" : "Reason, e.g. Self-referral detected"}
          aria-invalid={Boolean(error)}
          className={`min-w-0 flex-1 border bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus:outline-none ${error ? "border-danger" : "border-rule focus:border-accent"}`}
        />
        <button
          type="submit"
          disabled={busy}
          className={`px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${mode === "paid" ? "bg-accent hover:bg-accent-hover" : "bg-danger hover:opacity-90"}`}
        >
          {busy ? "Saving…" : mode === "paid" ? "Confirm paid" : "Reject"}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-danger" role="alert">{error}</p>}
    </form>
  );
}
