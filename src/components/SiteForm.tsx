"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteUrlError, normalizeSiteUrl } from "@/lib/url";

type Props = {
  onCreated?: () => void;
  onNeedsUpgrade?: (payload: {
    message: string;
    lockedCount?: number;
    code?: string;
  }) => void;
};

export function SiteForm({ onCreated, onNeedsUpgrade }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setHint(null);
    setLoading(true);
    try {
      // Cheap client-side suffix / host check before hitting the API.
      let normalizedUrl = url;
      try {
        normalizedUrl = normalizeSiteUrl(url).url;
      } catch (err) {
        if (err instanceof SiteUrlError) {
          setError(err.message);
          return;
        }
        setError("That doesn't look like a real domain.");
        return;
      }

      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url: normalizedUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (
          res.status === 403 &&
          (data.code === "SITE_LIMIT" || data.code === "HAS_LOCKED_SITES") &&
          onNeedsUpgrade
        ) {
          onNeedsUpgrade({
            message: data.error || "Site limit reached",
            lockedCount: data.lockedCount,
            code: data.code,
          });
          return;
        }
        setError(data.error || "Failed to add site");
        return;
      }
      setName("");
      setUrl("");
      if (data.hint) setHint(data.hint);
      onCreated?.();
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My portfolio"
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none ring-accent focus:ring-2"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">URL</label>
        <input
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="example.com"
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none ring-accent focus:ring-2"
        />
        <p className="mt-1 text-[11px] text-muted">
          We monitor the whole site — paths like /blog are dropped.
        </p>
      </div>
      {error && <p className="text-sm text-down">{error}</p>}
      {hint && !error && <p className="text-sm text-muted">{hint}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {loading ? "Adding…" : "Add site"}
      </button>
    </form>
  );
}
