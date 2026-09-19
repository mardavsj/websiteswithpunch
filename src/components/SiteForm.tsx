"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  mode: "create" | "edit";
  siteId?: string;
  initialName?: string;
  initialUrl?: string;
};

export function SiteForm({ mode, siteId, initialName = "", initialUrl = "" }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
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
        setError(data.error || "Something went wrong");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-5 rounded-none border border-rule bg-bg p-6">
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
          {loading ? "Saving…" : mode === "create" ? "Add site" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-none border border-rule px-4 py-2 text-sm text-ink hover:bg-accent-soft"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
