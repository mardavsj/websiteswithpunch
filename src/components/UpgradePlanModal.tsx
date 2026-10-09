"use client";

import { useCallback, useEffect, useState } from "react";
import { BillingIntervalToggle } from "@/components/BillingIntervalToggle";
import {
  ModalShell,
  NoRefundNote,
  PreviewSkeleton,
  primaryBtn,
  secondaryBtn,
  useEscapeClose,
} from "@/components/billing/modal-bits";
import { intervalParam, type BillingInterval } from "@/lib/billing-interval";
import { TAX_NOTE_SAVED_CARD, taxLine } from "@/lib/tax-copy";

type UpgradeProps = {
  open: boolean;
  loading: boolean;
  message: string | null;
  onClose: () => void;
  onConfirm: (interval: BillingInterval) => void;
  /** "business" = Pro → Business; the current plan = switch to annual billing. */
  targetPlan?: "pro" | "business";
  /** Yearly subscribers stay yearly, so the toggle is hidden for them. */
  currentInterval?: BillingInterval | null;
};

export type PlanPreview = {
  currentPlanName: string;
  targetPlanName: string;
  interval?: BillingInterval;
  samePlan?: boolean;
  intervalChanges?: boolean;
  keptPacks?: number;
  hadPacks: boolean;
  amountDueToday: number;
  amountDueTodayFormatted: string;
  taxTodayFormatted?: string | null;
  daysLeftInPeriod: number | null;
  nextRenewalFormatted: string | null;
  newRecurringMonthlyFormatted: string;
};

/** Dodo's prorated change: a full new period at the new price, minus unused time credited. */
function costLine(p: PlanPreview, interval: BillingInterval): string {
  const period = interval === "year" ? "year" : "month";
  const what = p.samePlan && p.keptPacks ? `${p.targetPlanName} and your site packs` : p.targetPlanName;
  return `That's a full ${period} of ${what}, minus a credit for the unused part of what you already paid for ${p.currentPlanName}.`;
}

export function UpgradePlanModal({
  open,
  loading,
  message,
  onClose,
  onConfirm,
  targetPlan = "business",
  currentInterval = "month",
}: UpgradeProps) {
  const switchOnly = targetPlan !== "business";
  // Set when the server reports a yearly subscription (callers that don't know the interval).
  const [serverYearly, setServerYearly] = useState(false);
  const yearlyNow = currentInterval === "year" || serverYearly;
  const locked = switchOnly || yearlyNow;
  const [interval, setBilling] = useState<BillingInterval>(locked ? "year" : "month");
  const [preview, setPreview] = useState<PlanPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setServerYearly(false);
    else setBilling(locked ? "year" : "month");
  }, [open, locked]);

  const loadPreview = useCallback(async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    setPreview(null);
    try {
      const res = await fetch(
        `/api/billing/preview-plan?planId=${targetPlan}&interval=${intervalParam(interval)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "ANNUAL_ONLY") {
          setServerYearly(true);
          setBilling("year");
          return;
        }
        setPreviewError(data.error || "Could not load preview.");
        return;
      }
      setPreview(data as PlanPreview);
    } catch {
      setPreviewError("Could not load preview.");
    } finally {
      setPreviewLoading(false);
    }
  }, [targetPlan, interval]);

  useEffect(() => {
    if (open) void loadPreview();
  }, [open, loadPreview]);

  useEscapeClose(open, onClose);
  if (!open) return null;

  const renew = preview?.nextRenewalFormatted || "your next billing date";
  const todayZero = preview != null && preview.amountDueToday === 0;
  const packs = preview?.keptPacks ?? 0;
  const title = switchOnly ? "Switch to annual billing" : "Upgrade to Business";

  return (
    <ModalShell titleId="upgrade-plan-title" onClose={onClose}>
      <h2 id="upgrade-plan-title" className="font-display text-xl font-medium text-ink">
        {title}
      </h2>
      {!locked && (
        <BillingIntervalToggle
          value={interval}
          onChange={setBilling}
          disabled={loading}
          className="mt-4"
        />
      )}
      {!switchOnly && yearlyNow && (
        <p className="mt-2 text-sm text-muted">You&apos;re billed yearly, so Business is billed yearly too.</p>
      )}

      <div className="mt-4 space-y-3">
        {previewLoading && <PreviewSkeleton />}
        {previewError && <p className="text-sm text-danger">{previewError}</p>}
        {preview && !previewLoading && (
          <>
            <p className="font-display text-2xl font-medium text-ink">
              {todayZero ? "Nothing to pay today." : `Pay ${preview.amountDueTodayFormatted} today`}
            </p>
            <p className="text-sm leading-relaxed text-muted">{costLine(preview, interval)}</p>
            {preview.hadPacks && (
              <p className="text-sm leading-relaxed text-muted">
                Your extra site packs are no longer needed. Business includes 50 sites.
              </p>
            )}
            {packs > 0 && (
              <p className="text-sm leading-relaxed text-muted">
                Your {packs} site pack{packs === 1 ? "" : "s"} move{packs === 1 ? "s" : ""} to yearly
                billing too, so everything renews on one date.
              </p>
            )}
            <p className="text-sm leading-relaxed text-muted">
              After that you&apos;ll pay {preview.newRecurringMonthlyFormatted}, next on {renew}.
              Your billing date moves to today.
            </p>
            {!todayZero && (
              <p className="text-xs text-muted">
                Charged to the payment method on your subscription. Your new plan starts once the payment is confirmed, usually within a couple of minutes.{" "}
                {taxLine(preview.taxTodayFormatted) ? `${taxLine(preview.taxTodayFormatted)}. ` : ""}
                {TAX_NOTE_SAVED_CARD}
              </p>
            )}
            <NoRefundNote />
          </>
        )}
      </div>

      {message && <p className="mt-3 text-sm text-danger">{message}</p>}
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onConfirm(interval)}
          disabled={loading || previewLoading || Boolean(previewError) || !preview}
          className={primaryBtn}
        >
          {loading
            ? "Working…"
            : preview && !todayZero
              ? `Pay ${preview.amountDueTodayFormatted} and ${switchOnly ? "switch" : "upgrade"}`
              : switchOnly
                ? "Switch to annual"
                : "Upgrade"}
        </button>
        <button type="button" onClick={onClose} disabled={loading} className={secondaryBtn}>
          Cancel
        </button>
      </div>
    </ModalShell>
  );
}
