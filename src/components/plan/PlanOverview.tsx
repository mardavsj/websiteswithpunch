"use client";

import { PLANS, SITE_PACKS, type PlanId } from "@/lib/plans";
import { useBillingSummary } from "@/components/billing/useBillingSummary";

export function PlanOverview({
  plan,
  sitePackCount,
  siteCount,
  siteLimit,
  lockedCount,
}: {
  plan: PlanId;
  sitePackCount: number;
  siteCount: number;
  siteLimit: number;
  lockedCount: number;
}) {
  const showBilling = plan === "pro" || plan === "business";
  const { summary } = useBillingSummary(showBilling, sitePackCount);
  const pack = showBilling ? SITE_PACKS[plan] : null;
  const effectivePacks = summary?.sitePackCount ?? sitePackCount;
  const packSubtotal =
    pack && effectivePacks > 0 ? effectivePacks * pack.pricePerMonth : 0;
  const planPrice = PLANS[plan].price;
  const total =
    summary?.monthlyTotalFormatted ||
    (planPrice + packSubtotal > 0 ? `$${planPrice + packSubtotal}/month` : "$0");

  return (
    <div className="rounded-none border border-rule bg-surface px-4 py-4">
      <p className="label-caps text-muted">Current plan</p>
      <p className="mt-2 font-display text-xl font-medium text-ink">{PLANS[plan].name}</p>
      <p className="mt-1 text-sm text-muted">{PLANS[plan].description}</p>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">Plan price</dt>
          <dd className="font-medium text-ink">
            {planPrice === 0 ? "Free" : `$${planPrice}/month`}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Site limit</dt>
          <dd className="font-medium text-ink">{siteLimit} sites</dd>
        </div>
        <div>
          <dt className="text-muted">Usage</dt>
          <dd className="font-medium text-ink">
            {siteCount} active
            {lockedCount > 0 ? ` · ${lockedCount} locked` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Total monthly</dt>
          <dd className="font-medium text-ink">{total}</dd>
        </div>
        {pack && (
          <>
            <div>
              <dt className="text-muted">Site packs</dt>
              <dd className="font-medium text-ink">
                {effectivePacks} × +{pack.sitesPerPack} sites ($
                {pack.pricePerMonth}/mo each)
                {packSubtotal > 0 ? ` · $${packSubtotal}/mo` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Next payment</dt>
              <dd className="font-medium text-ink">
                {summary?.nextPaymentDateFormatted
                  ? `${summary.monthlyTotalFormatted?.replace("/month", "") || total} on ${summary.nextPaymentDateFormatted}`
                  : "—"}
              </dd>
            </div>
          </>
        )}
        {summary?.paymentFailed && (
          <div className="sm:col-span-2 text-amber-900 dark:text-amber-100">
            Payment failed — update your card from Manage billing.
          </div>
        )}
      </dl>
    </div>
  );
}
