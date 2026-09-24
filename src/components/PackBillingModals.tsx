"use client";

import { useCallback, useEffect, useState } from "react";
import type { PlanId } from "@/lib/plans";
import { SITE_PACKS, getEffectiveSiteLimit } from "@/lib/plans";

type PreviewData = {
  sitesPerPack: number;
  packPricePerMonth: number;
  amountDueTodayFormatted: string;
  newRecurringMonthlyFormatted: string;
  nextRenewal: string | null;
  plan: PlanId;
};

function formatRenewal(iso: string | null): string {
  if (!iso) return "your next renewal";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "your next renewal";
  }
}

type AddProps = {
  open: boolean;
  plan: "pro" | "business";
  loading: boolean;
  message: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function AddPackModal({ open, plan, loading, message, onClose, onConfirm }: AddProps) {
  const pack = SITE_PACKS[plan];
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    setPreview(null);
    try {
      const res = await fetch("/api/stripe/preview-pack");
      const data = await res.json();
      if (!res.ok) {
        setPreviewError(data.error || "Could not load preview.");
        return;
      }
      setPreview(data as PreviewData);
    } catch {
      setPreviewError("Could not load preview.");
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void loadPreview();
  }, [open, loadPreview]);

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-pack-title"
        className="w-full max-w-lg rounded-none border border-rule bg-bg p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="add-pack-title" className="mb-3 font-display text-xl font-medium text-ink">
          Add +{pack.sitesPerPack} sites
        </h2>
        {previewLoading && <p className="text-sm text-muted">Loading price preview…</p>}
        {previewError && <p className="text-sm text-rose-700">{previewError}</p>}
        {preview && !previewLoading && (
          <p className="text-sm leading-relaxed text-muted">
            You&apos;ll pay{" "}
            <span className="font-medium text-ink">{preview.amountDueTodayFormatted}</span> today
            (prorated for the rest of this billing period), then{" "}
            <span className="font-medium text-ink">
              {preview.newRecurringMonthlyFormatted}/month
            </span>{" "}
            from {formatRenewal(preview.nextRenewal)}. One bill, same renewal date.
          </p>
        )}
        {message && <p className="mt-3 text-xs text-amber-700">{message}</p>}
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || previewLoading || Boolean(previewError)}
            className="rounded-none bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {loading ? "Confirming…" : "Confirm"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-none border border-rule px-4 py-2 text-sm text-ink hover:bg-accent-soft"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

type RemoveProps = {
  open: boolean;
  plan: "pro" | "business";
  sitePackCount: number;
  siteCount: number;
  monthlyTotal: number;
  loading: boolean;
  message: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function RemovePackModal({
  open,
  plan,
  sitePackCount,
  siteCount,
  monthlyTotal,
  loading,
  message,
  onClose,
  onConfirm,
}: RemoveProps) {
  const pack = SITE_PACKS[plan];
  const newLimitAfterRemove = getEffectiveSiteLimit(plan, sitePackCount - 1);
  const removeBlocked = siteCount > newLimitAfterRemove;

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-pack-title"
        className="w-full max-w-lg rounded-none border border-rule bg-bg p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="remove-pack-title" className="mb-3 font-display text-xl font-medium text-ink">
          Remove a pack
        </h2>
        {removeBlocked ? (
          <p className="text-sm leading-relaxed text-muted">
            You have {siteCount} sites. Removing a pack lowers your limit to {newLimitAfterRemove}.
            Remove {siteCount - newLimitAfterRemove} site
            {siteCount - newLimitAfterRemove === 1 ? "" : "s"} first.
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-muted">
            Removing a pack lowers your limit now and your bill from the next renewal. No refund for
            the current month. New limit: {newLimitAfterRemove} sites · $
            {monthlyTotal - pack.pricePerMonth}/mo.
          </p>
        )}
        {message && <p className="mt-3 text-xs text-amber-700">{message}</p>}
        <div className="mt-5 flex gap-3">
          {!removeBlocked && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="rounded-none bg-ink px-4 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Removing…" : "Confirm remove"}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-none border border-rule px-4 py-2 text-sm text-ink hover:bg-accent-soft"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
