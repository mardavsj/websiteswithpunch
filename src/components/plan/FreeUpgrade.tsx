"use client";

import { PLANS, SITE_PACKS } from "@/lib/plans";
import { planPrice } from "@/lib/billing-interval";
import { UpgradeCTA } from "@/components/UpgradeCTA";
import { TAX_NOTE_CHECKOUT } from "@/lib/tax-copy";
import { IconSpark } from "./icons";

/** Free plan: what Pro and Business add (catalog prices only), then the real checkout buttons. */
export function FreeUpgrade() {
  return (
    <section className="border border-rule bg-surface shadow-[0_1px_2px_0_hsl(var(--ink)/0.05)]">
      <header className="flex items-center gap-2 border-b border-rule px-4 py-3">
        <IconSpark className="h-4 w-4 text-accent" />
        <h2 className="label-caps flex-1 !text-ink/80">Room to grow</h2>
      </header>
      <div className="px-4 py-4">
        <p className="text-sm leading-relaxed text-muted">
          One site is a great start. When you&apos;re watching more, pick a plan. Same checks, more sites.
        </p>
        <div className="mt-4 grid gap-px border border-rule bg-rule">
          {(["pro", "business"] as const).map((id) => (
            <div key={id} className="bg-surface px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-display text-lg font-medium text-ink">{PLANS[id].name}</p>
                <p className="tabular-nums text-ink">
                  <span className="font-display text-lg font-medium">${planPrice(id, "month")}</span>
                  <span className="text-xs text-muted">/mo</span>
                </p>
              </div>
              <p className="mt-0.5 text-xs text-muted">
                {PLANS[id].siteLimit} sites · +{SITE_PACKS[id].sitesPerPack}-site packs · or ${planPrice(id, "year")}/yr (2 months free)
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <UpgradeCTA plan="free" />
        </div>
        <p className="mt-3 text-xs text-muted">{TAX_NOTE_CHECKOUT}</p>
      </div>
    </section>
  );
}
