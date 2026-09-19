"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Site = {
  id: string;
  name: string;
  url: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  site: Site;
};

export function EditSiteModal({ open, onClose, site }: Props) {
  const router = useRouter();
  const [name, setName] = useState(site.name);
  const [url, setUrl] = useState(site.url);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(site.name);
      setUrl(site.url);
      setError(null);
    }
  }, [open, site.name, site.url]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sites/${site.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-site-title"
        className="w-full max-w-lg rounded-none border border-rule bg-bg p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="edit-site-title" className="mb-5 font-display text-xl font-medium text-ink">
          Edit site
        </h2>
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-ink">Site name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Marketing site"
              className="mt-1.5 w-full rounded-none border border-rule bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">URL</label>
            <input
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="mt-1.5 w-full rounded-none border border-rule bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <p className="mt-1 text-xs text-muted">HTTPS recommended for SSL expiry checks.</p>
          </div>
          {error && (
            <div className="rounded-none bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
          )}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-none bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
            >
              {loading ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-none border border-rule px-4 py-2 text-sm text-ink hover:bg-accent-soft"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
