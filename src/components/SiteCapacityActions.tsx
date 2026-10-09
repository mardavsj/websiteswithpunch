"use client";

import { useState } from "react";
import { SITE_PACKS, canBuySitePack } from "@/lib/plans";
import { useToast } from "@/components/Toast";
import { PlanSummaryCard } from "@/components/billing/PlanSummaryCard";
import { PackActions } from "@/components/billing/PackActions";
import { CancelPlanFlow } from "@/components/billing/CancelPlanFlow";
import { DowngradeFlow } from "@/components/billing/DowngradeFlow";
import { PendingKeepSitesFlow } from "@/components/billing/PendingKeepSitesFlow";
import { useBillingSummary } from "@/components/billing/useBillingSummary";
import { useBillingActions } from "@/components/billing/useBillingActions";
import { IntervalSwitchModals } from "@/components/billing/IntervalSwitchModals";
import { formatPlanPrice } from "@/lib/billing-interval";
import type { SiteCapacityProps } from "@/components/billing/types";

export type { SiteCapacityProps };

export function SiteCapacityActions({
  plan,
  sitePackCount,
  siteCount,
  siteLimit,
  atLimit,
  remaining,
  keepOptions,
  cancelAtPeriodEnd: cancelProp,
  pendingPlan: pendingPlanProp,
  billing,
}: SiteCapacityProps & { billing?: ReturnType<typeof useBillingSummary> }) {
  const { toast } = useToast();
  const showBilling = plan === "pro" || plan === "business";
  const pack = showBilling ? SITE_PACKS[plan] : null;
  // The page can share its summary (one /api/billing/summary request for the whole page).
  const own = useBillingSummary(showBilling && !billing, sitePackCount);
  const { summary, loadSummary } = billing ?? own;
  const actions = useBillingActions({ plan, loadSummary, toast });
  const [busy, setBusy] = useState(false);
  const [flow, setFlow] = useState<
    "cancel" | "downgrade" | "pending-keep" | "annual" | "monthly" | null
  >(null);
  const interval = summary?.interval ?? "month";

  const hasPending = summary?.hasPendingRemoval ?? false;
  const pendingSites = summary?.pendingSitesToRemove ?? 0;
  const pendingDate = summary?.pendingPackChangeAtFormatted ?? null;
  const effectivePacks = summary?.sitePackCount ?? sitePackCount;
  const effectiveLimit = summary?.siteLimit ?? siteLimit;
  const cancelAtPeriodEnd = summary?.cancelAtPeriodEnd ?? cancelProp ?? false;
  const pendingPlan = summary?.pendingPlan ?? pendingPlanProp ?? null;
  const pendingPlanDate = summary?.pendingPlanAtFormatted ?? null;
  const chooseMax =
    summary?.pendingTargetLimit ??
    (pendingPlan === "free" ? 1 : pendingPlan === "pro" ? 10 : effectiveLimit);
  const allPacksAway =
    hasPending && pendingSites >= effectivePacks * (pack?.sitesPerPack || 5);
  const canBuy = showBilling && (hasPending || canBuySitePack(plan, effectivePacks));
  const canRemove = showBilling && effectivePacks > 0 && !allPacksAway;

  async function run(fn: () => Promise<boolean | null | void>) {
    setBusy(true);
    try {
      return await fn();
    } finally {
      setBusy(false);
    }
  }

  // Cancel and downgrade always open a confirm window (the site picker is skipped when every
  // active site fits), so the no-refund terms are shown before anything changes.
  async function onDowngrade() {
    if ((await actions.previewNeedsKeepPicker()) !== null) setFlow("downgrade");
  }

  if (!showBilling) return null;

  return (
    <div className="space-y-3">
      <PlanSummaryCard
        plan={plan}
        effectivePacks={effectivePacks}
        interval={interval}
        cancelAtPeriodEnd={cancelAtPeriodEnd}
        pendingPlan={pendingPlan}
        pendingPlanDate={pendingPlanDate}
        chooseMax={chooseMax}
        hasPendingRemoval={hasPending}
        pendingSites={pendingSites}
        pendingDate={pendingDate}
        loading={busy}
        onChooseActive={() => setFlow("pending-keep")}
        onResume={() => run(actions.resumePlan)}
        onUndoPack={() => run(actions.undoPendingRemoval)}
        onDowngrade={onDowngrade}
        onCancel={() => setFlow("cancel")}
        onSwitchAnnual={
          summary?.interval === "month" && !pendingPlan && !cancelAtPeriodEnd
            ? () => setFlow("annual")
            : undefined
        }
        onSwitchMonthly={
          summary?.interval === "year" && !summary.pendingInterval && !cancelAtPeriodEnd
            ? () => setFlow("monthly")
            : undefined
        }
        pendingMonthlyDate={summary?.pendingIntervalAtFormatted ?? null}
        pendingMonthlyPrice={summary?.pendingIntervalPriceFormatted ?? null}
        onKeepAnnual={() => run(actions.cancelMonthlySwitch)}
        packSlot={
          <PackActions
            plan={plan}
            siteCount={siteCount}
            siteLimit={effectiveLimit}
            canBuy={!!canBuy}
            canRemove={!!canRemove}
            atLimit={atLimit}
            remaining={remaining}
            keepOptions={keepOptions}
            interval={interval}
            onRefresh={loadSummary}
          />
        }
      />
      <CancelPlanFlow
        open={flow === "cancel"}
        plan={plan}
        keepOptions={keepOptions}
        endsOn={summary?.nextPaymentDateFormatted ?? pendingDate}
        loading={busy}
        onClose={() => setFlow(null)}
        onConfirm={async (ids) => {
          await run(async () => {
            if (await actions.confirmCancel(ids)) setFlow(null);
          });
        }}
      />
      <DowngradeFlow
        open={flow === "downgrade"}
        keepOptions={keepOptions}
        renewsOn={summary?.nextPaymentDateFormatted ?? null}
        newPrice={formatPlanPrice("pro", interval)}
        loading={busy}
        onClose={() => setFlow(null)}
        onConfirm={async (ids) => {
          await run(async () => {
            if (await actions.confirmDowngrade(ids)) setFlow(null);
          });
        }}
      />
      <IntervalSwitchModals
        flow={flow === "annual" || flow === "monthly" ? flow : null}
        plan={plan}
        busy={busy}
        onClose={() => setFlow(null)}
        run={run}
        switchToAnnual={actions.switchToAnnual}
        scheduleMonthly={actions.scheduleMonthly}
      />
      <PendingKeepSitesFlow
        open={flow === "pending-keep"}
        maxKeep={Math.min(chooseMax, keepOptions.length || 1)}
        keepOptions={keepOptions}
        loading={busy}
        onClose={() => setFlow(null)}
        onConfirm={async (ids) => {
          await run(async () => {
            if (await actions.confirmPendingKeep(ids)) setFlow(null);
          });
        }}
      />
    </div>
  );
}
