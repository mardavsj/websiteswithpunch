"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { SiteUrlError, normalizeSiteUrl } from "@/lib/url";

type Props = {
  mode: "create" | "edit";
  siteId?: string;
  initialName?: string;
  initialUrl?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function SiteForm({
  mode,
  siteId,
  initialName = "",
  initialUrl = "",
  onSuccess,
  onCancel,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState(initialName);
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const [lockedDup, setLockedDup] = useState<{ siteId: string; limit?: number } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  const pathHint = useMemo(() => {
    try {
      const n = normalizeSiteUrl(url);
      if (n.pathWasStripped) return `We monitor the whole site: ${n.hostKey}`;
    } catch {
      /* ignore while typing */
    }
    return null;
  }, [url]);

  function finishSuccess(hint?: string) {
    if (hint) toast(hint, "success");
    else if (mode === "create") toast("Site added.", "success");
    // Parent (AddSiteModal) closes + router.refresh(). Never push /dashboard/sites/new.
    if (onSuccess) onSuccess();
    else router.refresh();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setLockedDup(null);
    try {
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

      const endpoint = mode === "create" ? "/api/sites" : `/api/sites/${siteId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url: normalizedUrl }),
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
      const hint =
        data.hint ||
        (data.pathWasStripped && data.hostKey
          ? `We monitor the whole site: ${data.hostKey}`
          : undefined);
      finishSuccess(hint);
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
      toast("Site unlocked.", "success");
      if (onSuccess) onSuccess();
      else router.refresh();
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
        {pathHint && <p className="mt-1 text-xs text-muted">{pathHint}</p>}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      {lockedDup && (
        <button
          type="button"
          disabled={unlocking}
          onClick={unlockDuplicate}
          className="rounded-none border border-rule bg-accent-soft px-3 py-2 text-sm font-medium text-ink hover:bg-surface disabled:opacity-60"
        >
          {unlocking ? "Unlocking…" : "Unlock it"}
        </button>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-none bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {loading ? "Saving…" : mode === "create" ? "Add site" : "Save"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-none border border-rule px-4 py-2 text-sm text-ink hover:bg-accent-soft"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
