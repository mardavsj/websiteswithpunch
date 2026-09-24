"use client";

import { PLANS, type PlanId } from "@/lib/plans";
import type { ReactNode } from "react";

type Props = {
  plan: PlanId;
  siteCount: number;
  siteLimit: number;
  effectivePacks: number;
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
};

export function PlanSummaryCard({
  plan,
  siteCount,
  siteLimit,
  effectivePacks,
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
}: Props) {
  return (
    <div className="rounded-none border border-rule bg-bg px-4 py-4">
      <p className="label-caps text-muted">Your plan</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-lg font-medium text-ink">
            {PLANS[plan].name}
            {effectivePacks > 0
              ? ` · ${effectivePacks} pack${effectivePacks === 1 ? "" : "s"}`
              : ""}
          </p>
          <p className="mt-0.5 text-sm text-muted">
            {siteCount}/{siteLimit} active sites
            {monthlyTotalFormatted ? ` · ${monthlyTotalFormatted}` : ""}
          </p>
          {nextPaymentLine && !cancelAtPeriodEnd && (
            <p className="mt-0.5 text-sm text-muted">{nextPaymentLine}</p>
          )}
          {cancelAtPeriodEnd && pendingPlanDate && (
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-amber-900">
              <span>
                Your {PLANS[plan].name} plan ends on {pendingPlanDate}. {chooseMax} site
                {chooseMax === 1 ? "" : "s"} will stay active.
              </span>
              <button
                type="button"
                onClick={onChooseActive}
                className="rounded-none border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium"
              >
                Change which sites stay active
              </button>
              <button
                type="button"
                onClick={onResume}
                disabled={loading}
                className="rounded-none border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium disabled:opacity-60"
              >
                {loading ? "Working…" : "Resume plan"}
              </button>
            </p>
          )}
          {!cancelAtPeriodEnd && pendingPlan === "pro" && pendingPlanDate && (
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-amber-900">
              <span>
                Switching to Pro on {pendingPlanDate}. {chooseMax} sites will stay active.
              </span>
              <button
                type="button"
                onClick={onChooseActive}
                className="rounded-none border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium"
              >
                Change which sites stay active
              </button>
            </p>
          )}
          {hasPendingRemoval && pendingSites > 0 && pendingDate && (
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-amber-900">
              <span>
                {pendingSites} site{pendingSites === 1 ? "" : "s"} will be locked on {pendingDate}
              </span>
              <button
                type="button"
                onClick={onChooseActive}
                className="rounded-none border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium"
              >
                Change which sites stay active
              </button>
              <button
                type="button"
                onClick={onUndoPack}
                disabled={loading}
                className="rounded-none border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium disabled:opacity-60"
              >
                {loading ? "Working…" : "Undo"}
              </button>
            </p>
          )}
        </div>
      </div>
      {packSlot && <div className="mt-3">{packSlot}</div>}
      <div className="mt-3 flex flex-wrap gap-2 border-t border-rule pt-3">
        {plan === "business" && !pendingPlan && (
          <button
            type="button"
            onClick={onDowngrade}
            disabled={loading}
            className="text-xs text-muted underline-offset-2 hover:underline disabled:opacity-60"
          >
            Switch to Pro
          </button>
        )}
        {!cancelAtPeriodEnd && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="text-xs text-muted underline-offset-2 hover:underline disabled:opacity-60"
          >
            Cancel plan
          </button>
        )}
      </div>
    </div>
  );
}
