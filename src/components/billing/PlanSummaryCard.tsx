"use client";

import type { ReactNode } from "react";
import { PLANS, SITE_PACKS, type PlanId } from "@/lib/plans";
import { packPrice, type BillingInterval } from "@/lib/billing-interval";
import { IconArrow, IconLayers, IconSliders } from "@/components/plan/icons";

type Props = {
  plan: PlanId;
  effectivePacks: number;
  interval: BillingInterval;
  cancelAtPeriodEnd: boolean;
  pendingPlan: string | null;
  pendingPlanDate: string | null;
  chooseMax: number;
  hasPendingRemoval: boolean;
  pendingSites: number;
  pendingDate: string | null;
  loading: boolean;
  packSlot?: ReactNode;
  onChooseActive: () => void;
  onResume: () => void;
  onUndoPack: () => void;
  onDowngrade: () => void;
  onCancel: () => void;
  /** Shown for monthly subscribers: switch this plan to annual billing. */
  onSwitchAnnual?: () => void;
  /** Shown for annual subscribers: switch to monthly at renewal. */
  onSwitchMonthly?: () => void;
  /** Set while an annual → monthly switch is scheduled. */
  pendingMonthlyDate?: string | null;
  pendingMonthlyPrice?: string | null;
  onKeepAnnual?: () => void;
};

const calloutBtn =
  "border border-amber-300/80 bg-surface px-2.5 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100/60 disabled:opacity-60 dark:border-amber-400/30 dark:bg-transparent dark:text-amber-100 dark:hover:bg-amber-400/10";

/** A booked change: what happens and when, with the buttons that change or undo it. */
function Booked({ children, actions }: { children: ReactNode; actions: ReactNode }) {
  return (
    <div className="border-b border-rule bg-amber-50/70 px-4 py-3 dark:bg-amber-400/[0.06]">
      <p className="text-sm text-amber-950 dark:text-amber-100">{children}</p>
      <div className="mt-2 flex flex-wrap gap-2">{actions}</div>
    </div>
  );
}

function Option({ onClick, disabled, children, hint, tone = "ink" }: { onClick: () => void; disabled: boolean; children: ReactNode; hint?: string; tone?: "ink" | "accent" | "danger" }) {
  const color = tone === "accent" ? "text-accent" : tone === "danger" ? "text-rose-700 dark:text-rose-300" : "text-ink";
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="group flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent-soft/60 disabled:opacity-60">
      <span className="min-w-0 flex-1">
        <span className={`block text-sm font-medium ${color}`}>{children}</span>
        {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
      </span>
      <IconArrow className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

/** "Manage plan": booked changes, site packs and the plan options. */
export function PlanSummaryCard(p: Props) {
  const paid = p.plan === "free" ? null : p.plan;
  const pack = paid ? SITE_PACKS[paid] : null;
  const short = p.interval === "year" ? "yr" : "mo";
  const keepBtn = (
    <button type="button" onClick={p.onChooseActive} className={calloutBtn}>
      Change which sites stay active
    </button>
  );
  const work = (label: string) => (p.loading ? "Working…" : label);

  return (
    <section className="border border-rule bg-surface shadow-[0_1px_2px_0_hsl(var(--ink)/0.05)]">
      <header className="flex items-center gap-2 border-b border-rule px-4 py-3">
        <IconSliders className="h-4 w-4 text-muted" />
        <h2 className="label-caps flex-1 !text-ink/80">Manage plan</h2>
      </header>

      {p.cancelAtPeriodEnd && p.pendingPlanDate && (
        <Booked actions={<>{keepBtn}<button type="button" onClick={p.onResume} disabled={p.loading} className={calloutBtn}>{work("Resume plan")}</button></>}>
          Your {PLANS[p.plan].name} plan ends on <b className="font-medium">{p.pendingPlanDate}</b>. {p.chooseMax} site{p.chooseMax === 1 ? "" : "s"} will stay active.
        </Booked>
      )}
      {!p.cancelAtPeriodEnd && p.pendingPlan === "pro" && p.pendingPlanDate && (
        <Booked actions={<>{keepBtn}<button type="button" onClick={p.onResume} disabled={p.loading} className={calloutBtn}>{work("Keep Business")}</button></>}>
          Switching to Pro on <b className="font-medium">{p.pendingPlanDate}</b>. {p.chooseMax} sites will stay active.
        </Booked>
      )}
      {p.pendingMonthlyDate && !p.cancelAtPeriodEnd && (
        <Booked actions={<button type="button" onClick={p.onKeepAnnual} disabled={p.loading} className={calloutBtn}>{work("Keep annual billing")}</button>}>
          Switches to monthly on <b className="font-medium">{p.pendingMonthlyDate}</b>
          {p.pendingMonthlyPrice ? ` (${p.pendingMonthlyPrice})` : ""}.
        </Booked>
      )}
      {p.hasPendingRemoval && p.pendingSites > 0 && p.pendingDate && (
        <Booked actions={<>{keepBtn}<button type="button" onClick={p.onUndoPack} disabled={p.loading} className={calloutBtn}>{work("Undo")}</button></>}>
          {p.pendingSites} site{p.pendingSites === 1 ? "" : "s"} will be locked on <b className="font-medium">{p.pendingDate}</b>.
        </Booked>
      )}

      {pack && paid && (
        <div className="border-b border-rule px-4 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-accent-soft text-accent">
              <IconLayers className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">Site packs</p>
              <p className="mt-0.5 text-xs text-muted">
                +{pack.sitesPerPack} sites for ${packPrice(paid, p.interval)}/{short} each · up to {pack.maxPacks}
              </p>
            </div>
            <p className="font-display text-2xl font-medium tabular-nums leading-none text-ink">
              {p.effectivePacks}
              <span className="text-sm text-muted">/{pack.maxPacks}</span>
            </p>
          </div>
          <div className="mt-3 flex gap-1" aria-hidden>
            {Array.from({ length: pack.maxPacks }, (_, i) => (
              <span key={i} className={`h-1.5 flex-1 ${i < p.effectivePacks ? "bg-accent" : "bg-ink/[0.07]"}`} />
            ))}
          </div>
          {p.packSlot && <div className="mt-3">{p.packSlot}</div>}
        </div>
      )}

      <div className="divide-y divide-rule">
        {p.onSwitchAnnual && (
          <Option onClick={p.onSwitchAnnual} disabled={p.loading} tone="accent" hint="Pay yearly and get 2 months free">
            Switch to annual billing
          </Option>
        )}
        {p.onSwitchMonthly && (
          <Option onClick={p.onSwitchMonthly} disabled={p.loading} hint="Takes effect at your renewal date">
            Switch to monthly billing
          </Option>
        )}
        {p.plan === "business" && !p.pendingPlan && (
          <Option onClick={p.onDowngrade} disabled={p.loading} hint="10 sites, from your renewal date">
            Switch to Pro
          </Option>
        )}
        {!p.cancelAtPeriodEnd && (
          <Option onClick={p.onCancel} disabled={p.loading} tone="danger" hint="Keep everything until the period you've paid for ends">
            Cancel plan
          </Option>
        )}
      </div>
    </section>
  );
}
