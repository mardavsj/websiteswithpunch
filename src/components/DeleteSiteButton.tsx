"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmModal } from "@/components/ConfirmModal";

export function DeleteSiteButton({
  siteId,
  siteName,
  locked = false,
  hasLockedSites = false,
  className,
  disabled = false,
}: {
  siteId: string;
  siteName: string;
  locked?: boolean;
  hasLockedSites?: boolean;
  className?: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  let body: string;
  if (locked) {
    body =
      "This removes the site and its saved history permanently. This cannot be undone.";
  } else if (hasLockedSites) {
    body =
      "This removes the site and all its history permanently. You'll get 1 free slot to add a new site or unlock one of your locked sites.";
  } else {
    body = "This removes the site and all its history permanently. This cannot be undone.";
  }

  async function onConfirm() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sites/${siteId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error || "Could not delete site.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className={
          className ||
          "rounded-none bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:bg-red-400"
        }
      >
        Delete
      </button>
      <ConfirmModal
        open={open}
        onClose={() => {
          if (!loading) setOpen(false);
        }}
        title={`Delete ${siteName}?`}
        loading={loading}
        error={error}
        onConfirm={onConfirm}
      >
        <p>{body}</p>
      </ConfirmModal>
    </>
  );
}
