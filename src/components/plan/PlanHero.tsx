"use client";

import type { ReactNode } from "react";
import { PLANS, SITE_PACKS, type PlanId } from "@/lib/plans";
import { packPrice, planPrice, type BillingInterval } from "@/lib/billing-interval";
import type { BillingSummary } from "@/components/billing/types";
import { Chip, Meter } from "@/components/details/ui";
import { TAX_NOTE_PLAN } from "@/lib/tax-copy";
import { planStatus } from "./plan-status";

type Props = {
  plan: PlanId;
  summary: BillingSummary | null;
  sitePackCount: number;
  siteCount: number;
  siteLimit: number;
  lockedCount: number;
  cancelAtPeriodEnd?: boolean;
  pendingPlan?: string | null;
};

function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="min-w-0 bg-surface px-4 py-3">
      <p className="label-caps">{label}</p>
      <p className="mt-1 truncate font-display text-2xl font-medium tabular-nums tracking-tight text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

/** The plan at a glance: name + status, what you pay and when, capacity, and the price breakdown. */
export function PlanHero({ plan, summary: s, sitePackCount, siteCount, siteLimit, lockedCount, ...fallback }: Props) {
  const paid = plan === "free" ? null : plan;
  const interval: BillingInterval = s?.interval ?? "month";
  const short = interval === "year" ? "yr" : "mo";
  const packs = s?.sitePackCount ?? sitePackCount;
  const limit = s?.siteLimit ?? siteLimit;
  const base = paid ? planPrice(paid, interval) : 0;
  const unit = paid ? packPrice(paid, interval) : 0;
  const total = s?.monthlyTotalFormatted || (paid ? `$${base + packs * unit}/${interval === "year" ? "year" : "month"}` : "$0");
  const status = planStatus(plan, s, fallback);
  const date = s?.nextPaymentDateFormatted;
  const cancel = s?.cancelAtPeriodEnd ?? fallback.cancelAtPeriodEnd;

  let next: { value: string; sub: string };
  if (!paid) next = { value: "Nothing", sub: "Free plan, no card needed" };
  else if (cancel) next = { value: "None", sub: `Plan ends ${s?.pendingPlanAtFormatted ?? date ?? "at renewal"}` };
  else if (s?.nextChanges && s.nextTotalFormatted && date) next = { value: s.nextTotalFormatted, sub: `From ${date}, after your booked change` };
  else if (s?.nextAmountFormatted && date) next = { value: s.nextAmountFormatted, sub: `on ${date}` };
  else next = { value: "—", sub: s ? "Shown once your renewal date is confirmed" : "Loading…" };

  const ratio = limit > 0 ? siteCount / limit : 0;
  const free = Math.max(0, limit - siteCount);

  return (
    <section className="border border-rule bg-surface shadow-[0_1px_2px_0_hsl(var(--ink)/0.05)]">
      <div className="h-1 bg-accent" aria-hidden />
      <div className="px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex items-center justify-between gap-3">
          <p className="label-caps">Current plan</p>
          <Chip tone={status.tone}>{status.label}</Chip>
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-2">
          <h2 className="font-display text-4xl font-medium leading-none tracking-tight text-ink sm:text-5xl">{PLANS[plan].name}</h2>
          {paid && s?.intervalLabel && (
            <span className="mb-1 border border-rule px-2 py-0.5 text-xs font-medium text-muted">{s.intervalLabel} billing</span>
          )}
        </div>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">{PLANS[plan].description}</p>

        <div className="mt-5 grid gap-px border border-rule bg-rule sm:grid-cols-2">
          <Stat label={interval === "year" ? "You pay per year" : "You pay per month"} value={total.replace(/\/(month|year)$/, "")} sub={paid ? "plus applicable tax" : "Free, forever"} />
          <Stat label="Next payment" value={next.value} sub={next.sub} />
        </div>

        <div className="mt-5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-medium text-ink">Site capacity</p>
            <p className="text-sm tabular-nums text-muted">
              <span className="font-medium text-ink">{siteCount}</span> / {limit} active
            </p>
          </div>
          <div className="mt-2">
            <Meter value={ratio} tone={ratio >= 1 ? "warn" : "accent"} label="Active sites used" />
          </div>
          <p className="mt-1.5 text-xs text-muted">
            {free > 0 ? `${free} slot${free === 1 ? "" : "s"} free` : "Every slot is in use"}
            {lockedCount > 0 ? ` · ${lockedCount} locked` : ""}
            {paid ? ` · ${PLANS[plan].siteLimit} included${packs > 0 ? ` + ${packs * SITE_PACKS[paid].sitesPerPack} from packs` : ""}` : ""}
          </p>
        </div>

        {paid && (
          <dl className="mt-5 divide-y divide-rule border-y border-rule text-sm">
            <div className="flex items-center justify-between gap-3 py-2.5">
              <dt className="text-muted">{PLANS[plan].name} plan</dt>
              <dd className="tabular-nums text-ink">
                ${base}/{short}
                {interval === "year" && <span className="text-muted"> · ${base / 12}/mo</span>}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <dt className="text-muted">
                Site packs{packs > 0 ? ` · ${packs} × +${SITE_PACKS[paid].sitesPerPack}` : ""}
              </dt>
              <dd className="tabular-nums text-ink">{packs > 0 ? `$${packs * unit}/${short}` : <span className="text-muted">None</span>}</dd>
            </div>
          </dl>
        )}
        {s?.paymentFailed && (
          <p className="mt-4 border border-rose-300/60 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-200">
            Your last payment didn&apos;t go through. Update your card from Manage billing to keep your plan.
          </p>
        )}
        {paid && <p className="mt-3 text-xs text-muted">{TAX_NOTE_PLAN}</p>}
      </div>
    </section>
  );
}
