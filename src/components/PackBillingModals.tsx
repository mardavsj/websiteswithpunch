"use client";

import { useCallback, useEffect, useState } from "react";
import type { PlanId } from "@/lib/plans";
import { SITE_PACKS } from "@/lib/plans";

export type PackPreview = {
  action?: "add" | "remove";
  isUndo?: boolean;
  sitesPerPack: number;
  plan: PlanId;
  planName: string;
  siteCount?: number;
  amountDueToday: number;
  amountDueTodayFormatted: string;
  daysLeftInPeriod: number | null;
  nextRenewal: string | null;
  nextRenewalFormatted: string | null;
  newRecurringMonthlyFormatted: string;
  recurringBreakdown: string;
  keepSiteLimitUntilRenewal?: number;
  newSiteLimitFromRenewal?: number;
  newSiteLimit?: number;
};

function PreviewSkeleton() {
  return (
    <div className="animate-pulse space-y-3" aria-hidden>
      <div className="h-8 w-40 bg-rule/60" />
      <div className="h-4 w-full bg-rule/40" />
      <div className="h-4 w-5/6 bg-rule/40" />
      <div className="h-4 w-4/6 bg-rule/40" />
    </div>
  );
}

function useEscapeClose(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);
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
  const [preview, setPreview] = useState<PackPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    setPreview(null);
    try {
      const res = await fetch("/api/stripe/preview-pack?action=add");
      const data = await res.json();
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

  const days = preview?.daysLeftInPeriod;
  const daysLine =
    days != null && days > 0
      ? `This covers only the ${days} day${days === 1 ? "" : "s"} left in your current billing month. You're not paying for a full month.`
      : "This covers only the rest of your current billing month. You're not paying for a full month.";

  const todayZero = preview != null && preview.amountDueToday === 0;
  const renew = preview?.nextRenewalFormatted || "your next billing date";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-solid/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-pack-title"
        className="w-full max-w-lg rounded-none border border-rule bg-surface p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="add-pack-title" className="font-display text-xl font-medium text-ink">
          Add {pack.sitesPerPack} more sites
        </h2>

        <div className="mt-4 space-y-3">
          {previewLoading && <PreviewSkeleton />}
          {previewError && <p className="text-sm text-rose-700 dark:text-rose-300">{previewError}</p>}
          {preview && !previewLoading && (
            <>
              {todayZero || preview.isUndo ? (
                <p className="font-display text-2xl font-medium text-ink">Nothing to pay today.</p>
              ) : (
                <p className="font-display text-2xl font-medium text-ink">
                  Pay {preview.amountDueTodayFormatted} today
                </p>
              )}

              {preview.isUndo ? (
                <p className="text-sm leading-relaxed text-muted">
                  You&apos;d already paid for these sites this month.
                </p>
              ) : todayZero ? (
                <p className="text-sm leading-relaxed text-muted">
                  Nothing to pay today. You&apos;d already paid for these sites this month.
                </p>
              ) : (
                <p className="text-sm leading-relaxed text-muted">{daysLine}</p>
              )}

              <p className="text-sm leading-relaxed text-muted">
                From {renew} you&apos;ll pay {preview.newRecurringMonthlyFormatted} (
                {preview.recurringBreakdown}).
              </p>
              <p className="text-sm leading-relaxed text-muted">
                Still one payment a month, on the same date as now.
              </p>
              <p className="text-sm leading-relaxed text-muted">
                Your {pack.sitesPerPack} extra sites are ready right away. You can remove them
                anytime from your dashboard.
              </p>
              {!todayZero && !preview.isUndo && (
                <p className="text-xs text-muted">
                  Your bank may ask you to approve this payment. That&apos;s normal.
                </p>
              )}
            </>
          )}
        </div>

        {message && <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">{message}</p>}
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || previewLoading || Boolean(previewError) || !preview}
            className="rounded-none bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {loading
              ? "Working…"
              : preview && (todayZero || preview.isUndo)
                ? `Add ${pack.sitesPerPack} sites`
                : preview
                  ? `Pay ${preview.amountDueTodayFormatted} and add sites`
                  : "Add sites"}
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
      const res = await fetch("/api/stripe/preview-pack?action=remove");
      const data = await res.json();
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-solid/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-pack-title"
        className="w-full max-w-lg rounded-none border border-rule bg-surface p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="remove-pack-title" className="font-display text-xl font-medium text-ink">
          Remove {pack.sitesPerPack} sites
        </h2>

        <div className="mt-4 space-y-3">
          {previewLoading && <PreviewSkeleton />}
          {previewError && <p className="text-sm text-rose-700 dark:text-rose-300">{previewError}</p>}
          {preview && !previewLoading && (
            <>
              <p className="text-sm leading-relaxed text-muted">
                Nothing is charged or refunded today.
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
            className="rounded-none border border-rule px-4 py-2 text-sm text-ink hover:bg-accent-soft"
          >
            Keep them
          </button>
        </div>
      </div>
    </div>
  );
}

export { UpgradePlanModal } from "@/components/UpgradePlanModal";
export type { PlanPreview } from "@/components/UpgradePlanModal";
