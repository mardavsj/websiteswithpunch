"use client";

import Link from "next/link";
import { useBillingSummary } from "@/components/billing/useBillingSummary";
import type { PlanId } from "@/lib/plans";

/** Compact pending cancel / downgrade / pack notice; manage on /plan. */
export function DashboardPendingBanner({
  plan,
  sitePackCount,
}: {
  plan: PlanId;
  sitePackCount: number;
}) {
  const show = plan === "pro" || plan === "business";
  const { summary } = useBillingSummary(show, sitePackCount);
  if (!show || !summary) return null;

  const lines: string[] = [];
  if (summary.cancelAtPeriodEnd && summary.pendingPlanAtFormatted) {
    lines.push(`Your plan ends on ${summary.pendingPlanAtFormatted}.`);
  } else if (summary.pendingPlan === "pro" && summary.pendingPlanAtFormatted) {
    lines.push(`Switching to Pro on ${summary.pendingPlanAtFormatted}.`);
  }
  if (summary.hasPendingRemoval && summary.pendingPackChangeAtFormatted) {
    lines.push(
      `${summary.pendingSitesToRemove} site${summary.pendingSitesToRemove === 1 ? "" : "s"} will be locked on ${summary.pendingPackChangeAtFormatted}.`,
    );
  }
  if (!lines.length) return null;

  return (
    <div className="mt-6 rounded-none border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p>{lines.join(" ")}</p>
      <Link href="/plan" className="mt-2 inline-block font-medium underline underline-offset-2">
        Manage on My Plan
      </Link>
    </div>
  );
}
