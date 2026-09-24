"use client";

import { UpgradeCTA } from "@/components/UpgradeCTA";
import { SiteCapacityActions } from "@/components/SiteCapacityActions";
import { PlanOverview } from "@/components/plan/PlanOverview";
import { BillingInvoices } from "@/components/plan/BillingInvoices";
import type { SiteCapacityProps } from "@/components/billing/types";
import type { PlanId } from "@/lib/plans";

type Props = SiteCapacityProps & {
  lockedCount: number;
  hasBilling: boolean;
};

export function PlanPageClient({ lockedCount, hasBilling, ...capacity }: Props) {
  const plan = capacity.plan as PlanId;

  async function openPortal() {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  return (
    <div className="space-y-6">
      <PlanOverview
        plan={plan}
        sitePackCount={capacity.sitePackCount}
        siteCount={capacity.siteCount}
        siteLimit={capacity.siteLimit}
        lockedCount={lockedCount}
      />

      {plan === "free" ? (
        <div className="rounded-none border border-rule px-4 py-4">
          <p className="text-sm font-medium text-ink">Upgrade</p>
          <p className="mt-1 text-sm text-muted">Get more site slots with Pro or Business.</p>
          <div className="mt-3">
            <UpgradeCTA plan={plan} />
          </div>
        </div>
      ) : (
        <div className="-mt-3">
          <SiteCapacityActions {...capacity} />
        </div>
      )}

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-medium text-ink">Billing history</h2>
          {hasBilling && (
            <button
              type="button"
              onClick={openPortal}
              className="rounded-none border border-rule px-3 py-1.5 text-sm text-ink hover:bg-accent-soft"
            >
              Manage billing
            </button>
          )}
        </div>
        {hasBilling ? (
          <BillingInvoices />
        ) : (
          <p className="mt-2 text-sm text-muted">
            Billing history appears after you upgrade and have a Stripe customer on file.
          </p>
        )}
      </div>
    </div>
  );
}
