"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";

export type Prefs = { alertDown: boolean; alertSsl: boolean; alertDomain: boolean };
const ROWS: { key: keyof Prefs; title: string; body: string }[] = [
  { key: "alertDown", title: "Site down and recovered", body: "When a check can't reach a site, and once when it's back up." },
  { key: "alertSsl", title: "SSL certificate", body: "30, 7 and 1 day before expiry, when it expires, or if browsers stop trusting it." },
  { key: "alertDomain", title: "Domain expiry", body: "30, 7 and 1 day before the domain expires, and when it has expired." },
];

/** Toggles save instantly (optimistic) and roll back with a red error if the save fails. */
export function AlertPrefs({ initial, email }: { initial: Prefs; email: string }) {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  async function toggle(key: keyof Prefs) {
    const before = prefs;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setError(null);
    try {
      const res = await fetch("/api/alerts/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: next[key] }),
      });
      if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error || "Couldn't save.");
      toast(next[key] ? "Alerts turned on." : "Alerts turned off.", "success");
    } catch (e) {
      setPrefs(before);
      setError(e instanceof Error ? e.message : "Couldn't save.");
    }
  }

  return (
    <section id="alerts" className="mt-6 max-w-md scroll-mt-24 border border-rule bg-surface">
      <div className="border-b border-rule px-6 py-4">
        <p className="label-caps text-muted">Email alerts</p>
        <p className="mt-1 text-sm text-muted">
          Sent to <span className="text-ink">{email}</span> after our daily check or a Recheck. Not real-time.
        </p>
      </div>
      <ul className="divide-y divide-rule">
        {ROWS.map((r) => (
          <li key={r.key} className="flex items-start justify-between gap-4 px-6 py-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{r.title}</p>
              <p className="mt-0.5 text-xs leading-5 text-muted">{r.body}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[r.key]}
              aria-label={r.title}
              onClick={() => toggle(r.key)}
              className={`relative mt-0.5 h-6 w-11 shrink-0 border transition-colors ${
                prefs[r.key] ? "border-accent bg-accent" : "border-rule bg-bg"
              }`}
            >
              <span
                className={`absolute top-0.5 block h-4 w-4 transition-all ${
                  prefs[r.key] ? "left-[22px] bg-white" : "left-0.5 bg-muted"
                }`}
              />
            </button>
          </li>
        ))}
      </ul>
      {error && <p className="border-t border-rule px-6 py-3 text-sm text-danger">{error}</p>}
    </section>
  );
}
