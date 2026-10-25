"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Toggle a contact message between open and handled. */
export function MessageHandled({ id, handled }: { id: string; handled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/messages/${encodeURIComponent(id)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ handled: !handled }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't update the message.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't update the message.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={toggle} disabled={busy} className={`px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${handled ? "border border-rule text-ink hover:border-accent" : "bg-accent text-white hover:bg-accent-hover"}`}>
        {busy ? "Saving…" : handled ? "Reopen" : "Mark handled"}
      </button>
      {error && <span className="text-xs text-danger" role="alert">{error}</span>}
    </span>
  );
}
