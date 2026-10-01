"use client";

import { PLANS, SITE_PACKS, type PlanId } from "@/lib/plans";
import { packPrice, planPrice, type BillingInterval } from "@/lib/billing-interval";
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
  const paid = plan === "pro" || plan === "business" ? plan : null;
  const { summary } = useBillingSummary(paid !== null, sitePackCount);
  const pack = paid ? SITE_PACKS[paid] : null;
  // Interval comes from the Stripe subscription (billing-summary); monthly until it loads.
  const interval: BillingInterval = summary?.interval ?? "month";
  const per = interval === "year" ? "year" : "month";
  const short = interval === "year" ? "yr" : "mo";
  const effectivePacks = summary?.sitePackCount ?? sitePackCount;
  const packUnit = paid ? packPrice(paid, interval) : 0;
  const packSubtotal = pack && effectivePacks > 0 ? effectivePacks * packUnit : 0;
  const basePrice = paid ? planPrice(paid, interval) : 0;
  const total =
    summary?.monthlyTotalFormatted ||
    (basePrice + packSubtotal > 0 ? `$${basePrice + packSubtotal}/${per}` : "$0");
  const renews = summary?.nextPaymentDateFormatted;

  return (
    <div className="rounded-none border border-rule bg-surface px-4 py-4">
      <p className="label-caps text-muted">Current plan</p>
      <p className="mt-2 font-display text-xl font-medium text-ink">
        {PLANS[plan].name}
        {summary?.intervalLabel ? ` · ${summary.intervalLabel}` : ""}
        {renews && !summary?.cancelAtPeriodEnd ? ` · renews ${renews}` : ""}
      </p>
      <p className="mt-1 text-sm text-muted">{PLANS[plan].description}</p>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">Plan price</dt>
          <dd className="font-medium text-ink">
            {basePrice === 0 ? "Free" : `$${basePrice}/${per}`}
            {interval === "year" && paid ? ` ($${basePrice / 12}/mo, billed yearly)` : ""}
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
          <dt className="text-muted">{interval === "year" ? "Total per year" : "Total monthly"}</dt>
          <dd className="font-medium text-ink">{total}</dd>
        </div>
        {pack && (
          <>
            <div>
              <dt className="text-muted">Site packs</dt>
              <dd className="font-medium text-ink">
                {effectivePacks} × +{pack.sitesPerPack} sites (${packUnit}/{short} each)
                {packSubtotal > 0 ? ` · $${packSubtotal}/${short}` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Next payment</dt>
              <dd className="font-medium text-ink">
                {renews
                  ? `${total.replace(/\/(month|year)$/, "")} on ${renews}`
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
