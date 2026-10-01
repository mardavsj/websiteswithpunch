"use client";

import { CheckoutPlanModal } from "@/components/CheckoutPlanModal";
import { UpgradePlanModal } from "@/components/UpgradePlanModal";
import type { PlanUpgrade } from "@/components/usePlanUpgrade";
import type { BillingInterval } from "@/lib/billing-interval";

/** Both upgrade windows driven by usePlanUpgrade(). */
export function UpgradeModals({
  upgrade: u,
  currentInterval,
}: {
  upgrade: PlanUpgrade;
  currentInterval?: BillingInterval | null;
}) {
  return (
    <>
      <UpgradePlanModal
        open={u.upgradeOpen}
        loading={u.loading === "business"}
        message={u.message}
        currentInterval={currentInterval}
        onClose={() => u.setUpgradeOpen(false)}
        onConfirm={(interval) => void u.checkout("business", interval)}
      />
      <CheckoutPlanModal
        planId={u.choosePlan}
        loading={u.loading !== null}
        message={u.message}
        onClose={() => u.setChoosePlan(null)}
        onConfirm={(interval) => {
          if (u.choosePlan) void u.checkout(u.choosePlan, interval);
        }}
      />
    </>
  );
}
