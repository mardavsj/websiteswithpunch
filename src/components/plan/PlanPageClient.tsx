"use client";

import { useOpenPortal } from "@/components/billing/useOpenPortal";
import { useBillingSummary } from "@/components/billing/useBillingSummary";
import { SiteCapacityActions } from "@/components/SiteCapacityActions";
import { PlanHero } from "@/components/plan/PlanHero";
import { FreeUpgrade } from "@/components/plan/FreeUpgrade";
import { BillingInvoices, InvoicesEmpty } from "@/components/plan/BillingInvoices";
import { IconCard, IconReceipt } from "@/components/plan/icons";
import type { SiteCapacityProps } from "@/components/billing/types";
import type { PlanId } from "@/lib/plans";

type Props = SiteCapacityProps & {
  lockedCount: number;
  hasBilling: boolean;
};

const portalBtn =
  "inline-flex items-center gap-2 border border-rule bg-surface px-3 py-1.5 text-sm font-medium text-ink hover:bg-accent-soft disabled:opacity-60";

/** My Plan: hero + manage side by side (stacked on phones), billing history underneath. */
export function PlanPageClient({ lockedCount, hasBilling, ...capacity }: Props) {
  const plan = capacity.plan as PlanId;
  const paid = plan !== "free";
  // One summary request for the hero and the manage card.
  const billing = useBillingSummary(paid, capacity.sitePackCount);
  const { openPortal, opening } = useOpenPortal();

  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-5 lg:items-start">
        <div className="lg:col-span-3">
          <PlanHero
            plan={plan}
            summary={billing.summary}
            sitePackCount={capacity.sitePackCount}
            siteCount={capacity.siteCount}
            siteLimit={capacity.siteLimit}
            lockedCount={lockedCount}
            cancelAtPeriodEnd={capacity.cancelAtPeriodEnd}
            pendingPlan={capacity.pendingPlan}
          />
        </div>
        <div className="lg:col-span-2">
          {paid ? <SiteCapacityActions {...capacity} billing={billing} /> : <FreeUpgrade />}
        </div>
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <IconReceipt className="h-4 w-4 text-muted" />
            <h2 className="font-display text-lg font-medium text-ink">Billing history</h2>
          </div>
          {hasBilling && (
            <button type="button" onClick={openPortal} disabled={opening} className={portalBtn}>
              <IconCard className="h-4 w-4 text-muted" />
              {opening ? "Opening…" : "Manage billing"}
            </button>
          )}
        </div>
        {hasBilling ? (
          <BillingInvoices />
        ) : (
          <div className="border border-rule bg-surface">
            <InvoicesEmpty
              title={paid ? "No payments yet" : "Nothing to bill. Enjoy it."}
              body={
                paid
                  ? "Your first receipt will land here the moment a payment goes through."
                  : "You're on Free, so there's nothing to pay. Receipts and invoices show up here once you upgrade."
              }
            />
          </div>
        )}
        {hasBilling && (
          <p className="mt-2 text-xs text-muted">
            Update your card, billing details or download older receipts in Manage billing (Dodo Payments).
          </p>
        )}
      </section>
    </div>
  );
}
