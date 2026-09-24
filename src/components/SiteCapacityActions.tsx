"use client";

import { useState } from "react";
import { PLANS, SITE_PACKS, canBuySitePack } from "@/lib/plans";
import { useToast } from "@/components/Toast";
import { PlanSummaryCard } from "@/components/billing/PlanSummaryCard";
import { PackActions } from "@/components/billing/PackActions";
import { CancelPlanFlow } from "@/components/billing/CancelPlanFlow";
import { DowngradeFlow } from "@/components/billing/DowngradeFlow";
import { ChooseActiveSitesFlow } from "@/components/billing/ChooseActiveSitesFlow";
import { useBillingSummary } from "@/components/billing/useBillingSummary";
import { useBillingActions } from "@/components/billing/useBillingActions";
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
  allSiteOptions,
  cancelAtPeriodEnd: cancelProp,
  pendingPlan: pendingPlanProp,
}: SiteCapacityProps) {
  const { toast } = useToast();
  const showBilling = plan === "pro" || plan === "business";
  const pack = showBilling ? SITE_PACKS[plan] : null;
  const { summary, loadSummary } = useBillingSummary(showBilling, sitePackCount);
  const actions = useBillingActions({ plan, loadSummary, toast });
  const [busy, setBusy] = useState(false);
  const [flow, setFlow] = useState<"cancel" | "downgrade" | "choose" | null>(null);

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
  const lockedCount = allSiteOptions.filter((s) => s.locked).length;
  const showChooseOnly = !showBilling && lockedCount > 0;
  const nextPaymentLine =
    summary?.nextPaymentDateFormatted && summary.monthlyTotalFormatted
      ? `Next payment: ${summary.monthlyTotalFormatted.replace("/month", "")} on ${summary.nextPaymentDateFormatted}`
      : null;

  async function run(fn: () => Promise<boolean | null | void>) {
    setBusy(true);
    try {
      return await fn();
    } finally {
      setBusy(false);
    }
  }

  async function onCancel() {
    if (siteCount > 1) {
      setFlow("cancel");
      return;
    }
    const ids = siteCount === 1 && keepOptions[0] ? [keepOptions[0].id] : [];
    await run(async () => {
      if (await actions.confirmCancel(ids)) setFlow(null);
    });
  }

  async function onDowngrade() {
    const need = await actions.previewNeedsKeepPicker();
    if (need === null) return;
    if (need) setFlow("downgrade");
    else
      await run(async () => {
        if (await actions.confirmDowngrade([])) setFlow(null);
      });
  }

  if (showChooseOnly) {
    return (
      <div className="mt-6 space-y-3">
        <div className="rounded-none border border-rule bg-bg px-4 py-4">
          <p className="label-caps text-muted">Your plan</p>
          <p className="mt-2 font-display text-lg font-medium text-ink">{PLANS[plan].name}</p>
          <p className="mt-0.5 text-sm text-muted">
            {siteCount}/{siteLimit} active sites
            {lockedCount > 0 ? ` · ${lockedCount} locked` : ""}
          </p>
          <button
            type="button"
            onClick={() => setFlow("choose")}
            disabled={busy}
            className="mt-3 rounded-none border border-rule bg-bg px-3 py-1.5 text-sm font-medium text-ink hover:bg-accent-soft disabled:opacity-60"
          >
            Choose active sites
          </button>
        </div>
        <ChooseActiveSitesFlow
          open={flow === "choose"}
          maxKeep={siteLimit}
          allSiteOptions={allSiteOptions}
          keepOptions={keepOptions}
          loading={busy}
          cooldownMs={summary?.swapCooldownMs ?? 0}
          onClose={() => setFlow(null)}
          onConfirm={async (ids) => {
            await run(async () => {
              if (await actions.confirmChooseActive(ids, false)) setFlow(null);
            });
          }}
        />
      </div>
    );
  }

  if (!showBilling) return null;

  const pendingOnly = Boolean(pendingPlan || hasPending);

  return (
    <div className="mt-6 space-y-3">
      <PlanSummaryCard
        plan={plan}
        siteCount={siteCount}
        siteLimit={effectiveLimit}
        effectivePacks={effectivePacks}
        monthlyTotalFormatted={summary?.monthlyTotalFormatted ?? null}
        nextPaymentLine={nextPaymentLine}
        cancelAtPeriodEnd={cancelAtPeriodEnd}
        pendingPlan={pendingPlan}
        pendingPlanDate={pendingPlanDate}
        chooseMax={chooseMax}
        hasPendingRemoval={hasPending}
        pendingSites={pendingSites}
        pendingDate={pendingDate}
        loading={busy}
        showChooseActive={allSiteOptions.length > effectiveLimit}
        onChooseActive={() => setFlow("choose")}
        onResume={() => run(actions.resumePlan)}
        onUndoPack={() => run(actions.undoPendingRemoval)}
        onDowngrade={onDowngrade}
        onCancel={onCancel}
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
        loading={busy}
        onClose={() => setFlow(null)}
        onConfirm={async (ids) => {
          await run(async () => {
            if (await actions.confirmDowngrade(ids)) setFlow(null);
          });
        }}
      />
      <ChooseActiveSitesFlow
        open={flow === "choose"}
        maxKeep={Math.min(chooseMax, allSiteOptions.length || 1)}
        allSiteOptions={allSiteOptions}
        keepOptions={keepOptions}
        loading={busy}
        cooldownMs={summary?.swapCooldownMs ?? 0}
        onClose={() => setFlow(null)}
        onConfirm={async (ids) => {
          await run(async () => {
            if (await actions.confirmChooseActive(ids, pendingOnly)) setFlow(null);
          });
        }}
      />
    </div>
  );
}
