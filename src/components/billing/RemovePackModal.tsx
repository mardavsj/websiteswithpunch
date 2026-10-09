"use client";

import { readJson } from "@/lib/read-json";
import { useCallback, useEffect, useState } from "react";
import { SITE_PACKS } from "@/lib/plans";
import type { PackPreview } from "@/components/billing/types";
import {
  ModalShell,
  PreviewSkeleton,
  NoRefundNote,
  secondaryBtn,
  useEscapeClose,
} from "@/components/billing/modal-bits";

/** Removal takes effect at renewal (monthly or yearly); nothing is charged or credited today. */
type RemoveProps = {
  open: boolean;
  plan: "pro" | "business";
  loading: boolean;
  message: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function RemovePackModal({ open, plan, loading, message, onClose, onConfirm }: RemoveProps) {
  const pack = SITE_PACKS[plan];
  const [preview, setPreview] = useState<PackPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    setPreview(null);
    try {
      const res = await fetch("/api/billing/preview-pack?action=remove");
      const data = await readJson(res);
      if (!res.ok) {
        setPreviewError(data.error || "Could not load preview.");
        return;
      }
      setPreview(data as PackPreview);
    } catch {
      setPreviewError("Could not load preview.");
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void loadPreview();
  }, [open, loadPreview]);

  useEscapeClose(open, onClose);
  if (!open) return null;

  const renew = preview?.nextRenewalFormatted || "your next billing date";
  const keepLimit = preview?.keepSiteLimitUntilRenewal;
  const newLimit = preview?.newSiteLimitFromRenewal;

  return (
    <ModalShell titleId="remove-pack-title" onClose={onClose}>
      <h2 id="remove-pack-title" className="font-display text-xl font-medium text-ink">
        Remove {pack.sitesPerPack} sites
      </h2>

      <div className="mt-4 space-y-3">
        {previewLoading && <PreviewSkeleton />}
        {previewError && <p className="text-sm text-danger">{previewError}</p>}
        {preview && !previewLoading && (
          <>
            <p className="text-sm leading-relaxed text-muted">
              Nothing is charged today.
            </p>
            {keepLimit != null && (
              <p className="text-sm leading-relaxed text-muted">
                You keep all {keepLimit} sites until {renew}.
              </p>
            )}
            <p className="text-sm leading-relaxed text-muted">
              From {renew} your plan includes {newLimit} sites and you&apos;ll pay{" "}
              {preview.newRecurringMonthlyFormatted}.
            </p>
            <NoRefundNote keep />
          </>
        )}
      </div>

      {message && <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">{message}</p>}
      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading || previewLoading || Boolean(previewError) || !preview}
          className="rounded-none bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800 disabled:opacity-60"
        >
          {loading ? "Removing…" : `Remove ${pack.sitesPerPack} sites`}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className={secondaryBtn}
        >
          Keep them
        </button>
      </div>
    </ModalShell>
  );
}
