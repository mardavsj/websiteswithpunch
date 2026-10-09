import type { PlanId } from "@/lib/plans";
import type { KeepSiteOption } from "@/components/KeepSitesPicker";
import type { BillingInterval } from "@/lib/billing-interval";

export type BillingSummary = {
  /** True when this request found our copy out of date and re-synced it from Dodo. */
  healed?: boolean;
  plan: PlanId;
  planName: string;
  /** null on Free. */
  interval?: BillingInterval | null;
  intervalLabel?: string | null;
  /** "month" while an annual → monthly switch is scheduled for renewal. */
  pendingInterval?: "month" | null;
  pendingIntervalAtFormatted?: string | null;
  pendingIntervalPriceFormatted?: string | null;
  sitePackCount: number;
  siteLimit: number;
  /** Today's per-period total (current plan + packs). */
  monthlyTotalFormatted: string;
  /** What the next renewal bills, after any booked change. */
  nextTotalFormatted?: string | null;
  nextAmountFormatted?: string | null;
  /** True when the next renewal differs from today's total (a change is booked). */
  nextChanges?: boolean;
  nextPaymentDateFormatted: string | null;
  hasPendingRemoval: boolean;
  pendingSitesToRemove: number;
  pendingPackChangeAtFormatted: string | null;
  cancelAtPeriodEnd?: boolean;
  pendingPlan?: string | null;
  pendingPlanAtFormatted?: string | null;
  pendingTargetLimit?: number | null;
  paymentFailed?: boolean;
};

export type SiteCapacityProps = {
  plan: PlanId;
  sitePackCount: number;
  siteCount: number;
  siteLimit: number;
  atLimit: boolean;
  remaining: number;
  keepOptions: KeepSiteOption[];
  cancelAtPeriodEnd?: boolean;
  pendingPlan?: string | null;
  pendingPlanAt?: string | null;
};

/** /api/billing/preview-pack response. Amounts follow the subscription's interval. */
export type PackPreview = {
  interval?: BillingInterval;
  action?: "add" | "remove";
  isUndo?: boolean;
  sitesPerPack: number;
  plan: PlanId;
  planName: string;
  siteCount?: number;
  amountDueToday: number;
  amountDueTodayFormatted: string;
  /** Tax in today's charge, as reported by Dodo's preview (null when none). */
  taxTodayFormatted?: string | null;
  daysLeftInPeriod: number | null;
  nextRenewal: string | null;
  nextRenewalFormatted: string | null;
  newRecurringMonthlyFormatted: string;
  recurringBreakdown: string;
  keepSiteLimitUntilRenewal?: number;
  newSiteLimitFromRenewal?: number;
  newSiteLimit?: number;
};
