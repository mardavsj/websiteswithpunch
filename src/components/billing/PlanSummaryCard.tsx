"use client";

import { PLANS, type PlanId } from "@/lib/plans";
import type { ReactNode } from "react";

const amberBtn =
  "rounded-none border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium disabled:opacity-60 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100";
const amberRow =
  "mt-2 flex flex-wrap items-center gap-2 text-sm text-amber-900 dark:text-amber-100";
const mutedLink = "text-xs text-muted underline-offset-2 hover:underline disabled:opacity-60";

type Props = {
  plan: PlanId;
  siteCount: number;
  siteLimit: number;
  effectivePacks: number;
  /** "Monthly" / "Annual" from /api/billing/summary (null until loaded). */
  intervalLabel?: string | null;
  renewsOn?: string | null;
  monthlyTotalFormatted: string | null;
  nextPaymentLine: string | null;
  cancelAtPeriodEnd: boolean;
  pendingPlan: string | null;
  pendingPlanDate: string | null;
  chooseMax: number;
  hasPendingRemoval: boolean;
  pendingSites: number;
  pendingDate: string | null;
  loading: boolean;
  packSlot?: ReactNode;
  onChooseActive: () => void;
  onResume: () => void;
  onUndoPack: () => void;
  onDowngrade: () => void;
  onCancel: () => void;
  /** Shown for monthly subscribers: switch this plan to annual billing. */
  onSwitchAnnual?: () => void;
  /** Shown for annual subscribers: switch to monthly at renewal. */
  onSwitchMonthly?: () => void;
  /** Set while an annual → monthly switch is scheduled. */
  pendingMonthlyDate?: string | null;
  pendingMonthlyPrice?: string | null;
  onKeepAnnual?: () => void;
};

export function PlanSummaryCard({
  plan,
  siteCount,
  siteLimit,
  effectivePacks,
  intervalLabel,
  renewsOn,
  monthlyTotalFormatted,
  nextPaymentLine,
  cancelAtPeriodEnd,
  pendingPlan,
  pendingPlanDate,
  chooseMax,
  hasPendingRemoval,
  pendingSites,
  pendingDate,
  loading,
  packSlot,
  onChooseActive,
  onResume,
  onUndoPack,
  onDowngrade,
  onCancel,
  onSwitchAnnual,
  onSwitchMonthly,
  pendingMonthlyDate,
  pendingMonthlyPrice,
  onKeepAnnual,
}: Props) {
  return (
    <div className="rounded-none border border-rule bg-surface px-4 py-4">
      <p className="label-caps text-muted">Your plan</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-lg font-medium text-ink">
            {PLANS[plan].name}
            {intervalLabel ? ` · ${intervalLabel}` : ""}
            {effectivePacks > 0
              ? ` · ${effectivePacks} pack${effectivePacks === 1 ? "" : "s"}`
              : ""}
            {renewsOn && !cancelAtPeriodEnd && !pendingPlan ? ` · renews ${renewsOn}` : ""}
          </p>
          <p className="mt-0.5 text-sm text-muted">
            {siteCount}/{siteLimit} active sites
            {monthlyTotalFormatted ? ` · ${monthlyTotalFormatted}` : ""}
          </p>
          {nextPaymentLine && !cancelAtPeriodEnd && (
            <p className="mt-0.5 text-sm text-muted">{nextPaymentLine}</p>
          )}
          {cancelAtPeriodEnd && pendingPlanDate && (
            <p className={amberRow}>
              <span>
                Your {PLANS[plan].name} plan ends on {pendingPlanDate}. {chooseMax} site
                {chooseMax === 1 ? "" : "s"} will stay active.
              </span>
              <button
                type="button"
                onClick={onChooseActive}
                className={amberBtn}
              >
                Change which sites stay active
              </button>
              <button
                type="button"
                onClick={onResume}
                disabled={loading}
                className={amberBtn}
              >
                {loading ? "Working…" : "Resume plan"}
              </button>
            </p>
          )}
          {!cancelAtPeriodEnd && pendingPlan === "pro" && pendingPlanDate && (
            <p className={amberRow}>
              <span>
                Switching to Pro on {pendingPlanDate}. {chooseMax} sites will stay active.
              </span>
              <button
                type="button"
                onClick={onChooseActive}
                className={amberBtn}
              >
                Change which sites stay active
              </button>
              <button type="button" onClick={onResume} disabled={loading} className={amberBtn}>
                {loading ? "Working…" : "Keep Business"}
              </button>
            </p>
          )}
          {pendingMonthlyDate && !cancelAtPeriodEnd && (
            <p className={amberRow}>
              <span>
                Switches to monthly on {pendingMonthlyDate}
                {pendingMonthlyPrice ? ` (${pendingMonthlyPrice})` : ""}.
              </span>
              <button type="button" onClick={onKeepAnnual} disabled={loading} className={amberBtn}>
                {loading ? "Working…" : "Keep annual billing"}
              </button>
            </p>
          )}
          {hasPendingRemoval && pendingSites > 0 && pendingDate && (
            <p className={amberRow}>
              <span>
                {pendingSites} site{pendingSites === 1 ? "" : "s"} will be locked on {pendingDate}
              </span>
              <button
                type="button"
                onClick={onChooseActive}
                className={amberBtn}
              >
                Change which sites stay active
              </button>
              <button
                type="button"
                onClick={onUndoPack}
                disabled={loading}
                className={amberBtn}
              >
                {loading ? "Working…" : "Undo"}
              </button>
            </p>
          )}
        </div>
      </div>
      {packSlot && <div className="mt-3">{packSlot}</div>}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-rule pt-3">
        {onSwitchAnnual && (
          <button
            type="button"
            onClick={onSwitchAnnual}
            disabled={loading}
            className="text-xs font-medium text-accent underline-offset-2 hover:underline disabled:opacity-60"
          >
            Switch to annual billing (2 months free)
          </button>
        )}
        {onSwitchMonthly && (
          <button type="button" onClick={onSwitchMonthly} disabled={loading} className={mutedLink}>
            Switch to monthly billing
          </button>
        )}
        {plan === "business" && !pendingPlan && (
          <button
            type="button"
            onClick={onDowngrade}
            disabled={loading}
            className={mutedLink}
          >
            Switch to Pro
          </button>
        )}
        {!cancelAtPeriodEnd && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className={mutedLink}
          >
            Cancel plan
          </button>
        )}
      </div>
    </div>
  );
}
