"use client";

import { useState } from "react";

export function UpgradeCTA({ plan }: { plan: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (plan === "pro") {
    return (
      <button
        onClick={async () => {
          setLoading(true);
          setMessage(null);
          try {
            const res = await fetch("/api/stripe/portal", { method: "POST" });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
            else setMessage(data.error || "Billing portal unavailable. Configure Stripe keys.");
          } catch {
            setMessage("Could not open billing portal.");
          } finally {
            setLoading(false);
          }
        }}
        disabled={loading}
        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        {loading ? "Opening…" : "Manage billing"}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={async () => {
          setLoading(true);
          setMessage(null);
          try {
            const res = await fetch("/api/stripe/checkout", { method: "POST" });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
            else setMessage(data.error || "Stripe is not configured yet. See README for setup.");
          } catch {
            setMessage("Checkout failed. Check Stripe configuration.");
          } finally {
            setLoading(false);
          }
        }}
        disabled={loading}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {loading ? "Redirecting…" : "Upgrade to Pro — $12/mo"}
      </button>
      {message && <p className="text-xs text-amber-700">{message}</p>}
    </div>
  );
}
