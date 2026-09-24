import type { PlanId } from "@/lib/plans";
import type { KeepSiteOption } from "@/components/KeepSitesPicker";

export type BillingSummary = {
  plan: PlanId;
  planName: string;
  sitePackCount: number;
  siteLimit: number;
  monthlyTotalFormatted: string;
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

export type SiteOption = KeepSiteOption & { locked?: boolean };

export type SiteCapacityProps = {
  plan: PlanId;
  sitePackCount: number;
  siteCount: number;
  siteLimit: number;
  atLimit: boolean;
  remaining: number;
  keepOptions: KeepSiteOption[];
  allSiteOptions: SiteOption[];
  cancelAtPeriodEnd?: boolean;
  pendingPlan?: string | null;
  pendingPlanAt?: string | null;
};
