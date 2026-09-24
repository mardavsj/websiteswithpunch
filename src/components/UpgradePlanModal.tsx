"use client";

import { useCallback, useEffect, useState } from "react";

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

type UpgradeProps = {
  open: boolean;
  loading: boolean;
  message: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export type PlanPreview = {
  currentPlanName: string;
  targetPlanName: string;
  hadPacks: boolean;
  amountDueToday: number;
  amountDueTodayFormatted: string;
  daysLeftInPeriod: number | null;
  nextRenewalFormatted: string | null;
  newRecurringMonthlyFormatted: string;
};

export function UpgradePlanModal({ open, loading, message, onClose, onConfirm }: UpgradeProps) {
  const [preview, setPreview] = useState<PlanPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    setPreview(null);
    try {
      const res = await fetch("/api/stripe/preview-plan?planId=business");
      const data = await res.json();
      if (!res.ok) {
        setPreviewError(data.error || "Could not load preview.");
        return;
      }
      setPreview(data as PlanPreview);
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
  const todayZero = preview != null && preview.amountDueToday === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-solid/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-plan-title"
        className="w-full max-w-lg rounded-none border border-rule bg-surface p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="upgrade-plan-title" className="font-display text-xl font-medium text-ink">
          Upgrade to Business
        </h2>

        <div className="mt-4 space-y-3">
          {previewLoading && <PreviewSkeleton />}
          {previewError && <p className="text-sm text-rose-700 dark:text-rose-300">{previewError}</p>}
          {preview && !previewLoading && (
            <>
              {todayZero ? (
                <p className="font-display text-2xl font-medium text-ink">Nothing to pay today.</p>
              ) : (
                <p className="font-display text-2xl font-medium text-ink">
                  Pay {preview.amountDueTodayFormatted} today
                </p>
              )}
              <p className="text-sm leading-relaxed text-muted">
                That&apos;s the Business price for the rest of this month, minus what you already
                paid for {preview.currentPlanName} this month.
              </p>
              {preview.hadPacks && (
                <p className="text-sm leading-relaxed text-muted">
                  Your extra site packs are no longer needed. Business includes 50 sites.
                </p>
              )}
              <p className="text-sm leading-relaxed text-muted">
                From {renew} you&apos;ll pay {preview.newRecurringMonthlyFormatted}.
              </p>
              {!todayZero && (
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
              : preview && !todayZero
                ? `Pay ${preview.amountDueTodayFormatted} and upgrade`
                : "Upgrade"}
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
