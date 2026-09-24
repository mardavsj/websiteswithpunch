"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  mode: "create" | "edit";
  siteId?: string;
  initialName?: string;
  initialUrl?: string;
  onSuccess?: () => void;
};

export function SiteForm({
  mode,
  siteId,
  initialName = "",
  initialUrl = "",
  onSuccess,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const [lockedDup, setLockedDup] = useState<{ siteId: string; limit?: number } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setLockedDup(null);
    try {
      const endpoint = mode === "create" ? "/api/sites" : `/api/sites/${siteId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "LOCKED_DUPLICATE" && data.siteId) {
          setLockedDup({ siteId: data.siteId, limit: data.limit });
          setError(data.error || "This site is already in your list but locked.");
        } else {
          setError(data.error || "Something went wrong");
        }
        return;
      }
      if (onSuccess) onSuccess();
      else if (mode === "create") router.push("/dashboard");
      else router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function unlockDuplicate() {
    if (!lockedDup) return;
    setUnlocking(true);
    setError(null);
    try {
      const res = await fetch(`/api/sites/${lockedDup.siteId}/unlock`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error ||
            (lockedDup.limit
              ? `Your plan includes ${lockedDup.limit} active sites. Delete an active site or upgrade to free a slot.`
              : "Could not unlock."),
        );
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setUnlocking(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full border border-rule bg-bg px-3 py-2 text-sm"
          placeholder="My shop"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-ink">URL</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          className="mt-1 w-full border border-rule bg-bg px-3 py-2 text-sm"
          placeholder="https://example.com"
        />
      </div>
      {error && <p className="text-sm text-rose-700">{error}</p>}
      {lockedDup && (
        <button
          type="button"
          disabled={unlocking}
          onClick={unlockDuplicate}
          className="rounded-none border border-rule bg-accent-soft px-3 py-2 text-sm font-medium text-ink hover:bg-white disabled:opacity-60"
        >
          {unlocking ? "Unlocking…" : "Unlock it"}
        </button>
      )}
      <button
        type="submit"
        disabled={loading}
        className="rounded-none bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {loading ? "Saving…" : mode === "create" ? "Add site" : "Save"}
      </button>
    </form>
  );
}
