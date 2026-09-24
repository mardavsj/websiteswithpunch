"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteUrlError, normalizeSiteUrl } from "@/lib/url";

type Props = {
  open: boolean;
  onClose: () => void;
  site: { id: string; name: string; url: string } | null;
};

export function EditSiteModal({ open, onClose, site }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (site) {
      setName(site.name);
      setUrl(site.url);
      setError(null);
      setHint(null);
    }
  }, [site]);

  if (!open || !site) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!site) return;
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

      const res = await fetch(`/api/sites/${site.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url: normalizedUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update");
        return;
      }
      if (data.hint) setHint(data.hint);
      onClose();
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Edit site</h2>
            <p className="mt-1 text-sm text-muted">Update the display name or URL.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-muted hover:bg-bg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none ring-accent focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">URL</label>
            <input
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none ring-accent focus:ring-2"
            />
            <p className="mt-1 text-[11px] text-muted">
              Paths are dropped — we monitor the whole site.
            </p>
          </div>
          {error && <p className="text-sm text-down">{error}</p>}
          {hint && !error && <p className="text-sm text-muted">{hint}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-bg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
