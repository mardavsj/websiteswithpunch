"use client";

import { useState } from "react";
import type { FormEvent } from "react";

type Method = "paypal" | "upi";

const OPTIONS: Array<{ id: Method; label: string; hint: string; placeholder: string }> = [
  { id: "paypal", label: "PayPal", hint: "Paid in USD to your PayPal account.", placeholder: "you@example.com" },
  { id: "upi", label: "UPI (India)", hint: "Paid in INR at the day's exchange rate.", placeholder: "yourname@okhdfcbank" },
];

/** Collapsed "Payout method" row; Edit opens the form inline. Where payouts go. Saved server-side (validated, rate-limited, audited, and emailed on change). */
export function PayoutForm({ method, address }: { method: Method | null; address: string | null }) {
  const [saved, setSaved] = useState({ method, address });
  const [m, setM] = useState<Method>(method ?? "paypal");
  const [value, setValue] = useState(address ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [open, setOpen] = useState(false);
  const opt = OPTIONS.find((o) => o.id === m)!;
  const dirty = m !== saved.method || value.trim().toLowerCase() !== (saved.address ?? "");

  async function submit(e: FormEvent) {
    e.preventDefault();
    const v = value.trim();
    if (!v.includes("@")) return setError(m === "paypal" ? "Enter the email address of your PayPal account." : "Enter a valid UPI ID, like name@bank.");
    setBusy(true);
    setError(null);
    setOk(false);
    try {
      const res = await fetch("/api/referrals/payout-method", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: m, address: v }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't save your payout method.");
      setSaved({ method: data.method, address: data.address });
      setValue(data.address);
      setOk(true);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your payout method.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border border-rule bg-surface" id="payout">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">Payout method</p>
          <p className="truncate text-xs text-muted">
            {saved.address ? `${saved.method === "upi" ? "UPI" : "PayPal"} · ${saved.address}` : "Not set. Add PayPal or UPI to withdraw."}
          </p>
          {ok && !open && <p className="text-xs text-emerald-600 dark:text-emerald-400">Saved. Future payouts go here.</p>}
        </div>
        <button
          type="button"
          onClick={() => { setOpen((o) => !o); setError(null); setOk(false); }}
          aria-expanded={open}
          aria-controls="payout-form"
          className="shrink-0 border border-rule px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
        >
          {open ? "Cancel" : saved.address ? "Edit" : "Add"}
        </button>
      </div>
      {open && (
      <form id="payout-form" onSubmit={submit} className="border-t border-rule px-4 py-4" noValidate>
        <div role="radiogroup" aria-label="Payout method" className="grid grid-cols-2 gap-px border border-rule bg-rule">
          {OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={m === o.id}
              onClick={() => { setM(o.id); setError(null); setOk(false); }}
              className={`px-3 py-2 text-sm font-medium transition-colors ${m === o.id ? "bg-accent text-white" : "bg-surface text-muted hover:text-ink"}`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <label htmlFor="payout-address" className="mt-4 block text-sm font-medium text-ink">
          {m === "paypal" ? "PayPal email" : "UPI ID"}
        </label>
        <input
          id="payout-address"
          type={m === "paypal" ? "email" : "text"}
          inputMode="email"
          autoComplete={m === "paypal" ? "email" : "off"}
          spellCheck={false}
          maxLength={254}
          placeholder={opt.placeholder}
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(null); setOk(false); }}
          aria-invalid={Boolean(error)}
          aria-describedby="payout-hint"
          className={`mt-1.5 w-full border bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:outline-none ${error ? "border-danger" : "border-rule focus:border-accent"}`}
        />
        <p id="payout-hint" className="mt-1.5 text-xs text-muted">{opt.hint} Double-check it: we send to exactly this address.</p>
        {error && <p className="mt-1.5 text-xs text-danger" role="alert">{error}</p>}
        <button
          type="submit"
          disabled={busy || !dirty || !value.trim()}
          className="mt-4 w-full bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {busy ? "Saving…" : saved.address ? "Update payout method" : "Save payout method"}
        </button>
      </form>
      )}
    </section>
  );
}
