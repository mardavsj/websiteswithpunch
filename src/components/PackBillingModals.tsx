"use client";

import { readJson } from "@/lib/read-json";
import { useCallback, useEffect, useState } from "react";
import { SITE_PACKS } from "@/lib/plans";
import { periodWord } from "@/lib/billing-interval";
import type { PackPreview } from "@/components/billing/types";
import {
  ModalShell,
  NoRefundNote,
  PreviewSkeleton,
  primaryBtn,
  secondaryBtn,
  useEscapeClose,
} from "@/components/billing/modal-bits";
import { TAX_NOTE_SAVED_CARD, taxLine } from "@/lib/tax-copy";

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
      const res = await fetch("/api/billing/preview-pack?action=add");
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

  // Packs bill on the subscription's interval, so the wording follows it (month or year).
  const period = periodWord(preview?.interval ?? "month");
  const days = preview?.daysLeftInPeriod;
  const creditLine =
    days != null && days > 0
      ? `minus a credit for the ${days} unused day${days === 1 ? "" : "s"} of your current ${period}`
      : `minus a credit for the unused part of your current ${period}`;

  const todayZero = preview != null && preview.amountDueToday === 0;
  const renew = preview?.nextRenewalFormatted || "your next billing date";

  return (
    <ModalShell titleId="add-pack-title" onClose={onClose}>
      <h2 id="add-pack-title" className="font-display text-xl font-medium text-ink">
        Add {pack.sitesPerPack} more sites
      </h2>

      <div className="mt-4 space-y-3">
        {previewLoading && <PreviewSkeleton />}
        {previewError && <p className="text-sm text-danger">{previewError}</p>}
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
                You&apos;d already paid for these sites until {renew}. Nothing changes on your bill.
              </p>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-muted">
                  Today&apos;s payment starts a new billing {period} for your plan and packs,{" "}
                  {creditLine}.
                </p>
                <p className="text-sm leading-relaxed text-muted">
                  After that you&apos;ll pay {preview.newRecurringMonthlyFormatted} (
                  {preview.recurringBreakdown}) every {period}, next on {renew}.
                </p>
              </>
            )}
            <p className="text-sm leading-relaxed text-muted">
              Your {pack.sitesPerPack} extra sites are ready as soon as the payment is confirmed,
              usually within a couple of minutes. You can remove them anytime from your dashboard.
            </p>
            {!todayZero && !preview.isUndo && (
              <p className="text-xs text-muted">
                Charged to the payment method on your subscription.{" "}
                {taxLine(preview.taxTodayFormatted) ? `${taxLine(preview.taxTodayFormatted)}. ` : ""}
                {TAX_NOTE_SAVED_CARD}
              </p>
            )}
            <NoRefundNote />
          </>
        )}
      </div>

      {message && <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">{message}</p>}
      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading || previewLoading || Boolean(previewError) || !preview}
          className={primaryBtn}
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
          className={secondaryBtn}
        >
          Cancel
        </button>
      </div>
    </ModalShell>
  );
}

export { RemovePackModal } from "@/components/billing/RemovePackModal";
export type { PackPreview } from "@/components/billing/types";
export { UpgradePlanModal } from "@/components/UpgradePlanModal";
export type { PlanPreview } from "@/components/UpgradePlanModal";
