"use client";

import { useState } from "react";

export function UnsubscribeButton({ token, label }: { token: string; label: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setState("busy");
    setError(null);
    try {
      const res = await fetch(`/api/alerts/unsubscribe?t=${encodeURIComponent(token)}`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Couldn't unsubscribe. Please try again.");
      setState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't unsubscribe. Please try again.");
      setState("idle");
    }
  }

  if (state === "done") {
    return <p className="mt-5 border-l-4 border-emerald-600 bg-emerald-600/10 px-3 py-2 text-sm text-ink">Done. You won&apos;t get {label} anymore.</p>;
  }
  return (
    <>
      <button
        type="button"
        onClick={go}
        disabled={state === "busy"}
        className="mt-5 w-full bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {state === "busy" ? "Unsubscribing…" : "Unsubscribe"}
      </button>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </>
  );
}
