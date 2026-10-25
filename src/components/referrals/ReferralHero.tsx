"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { fmtUsd, ratePercent } from "@/lib/referrals/config";

function Stat({ label, value, sub }: { label: string; value: ReactNode; sub: string }) {
  return (
    <div className="min-w-0 bg-surface px-4 py-3">
      <p className="label-caps">{label}</p>
      <p className="mt-1 truncate font-display text-2xl font-medium tabular-nums tracking-tight text-ink">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{sub}</p>
    </div>
  );
}

/** Link + copy/share and the three funnel numbers. */
export function ReferralHero({ link, clicks, signups, paying, earned }: { link: string; clicks: number; signups: number; paying: number; earned: number }) {
  const [copied, setCopied] = useState<"ok" | "fail" | null>(null);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <section className="border border-rule bg-surface shadow-[0_1px_2px_0_hsl(var(--ink)/0.05)]">
      <div className="h-1 bg-accent" aria-hidden />
      <div className="px-4 py-5 sm:px-6 sm:py-6">
        <p className="label-caps">Referral program</p>
        <h2 className="mt-3 font-display text-3xl font-medium leading-tight tracking-tight text-ink sm:text-4xl">
          Earn {ratePercent}% of every payment
        </h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
          Share your link. When someone signs up through it and pays for Pro, Business or site packs, you get {ratePercent}% of what
          they pay, for as long as they stay subscribed.
        </p>

        <label htmlFor="ref-link" className="mt-5 block text-sm font-medium text-ink">Your link</label>
        <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
          <input
            id="ref-link"
            readOnly
            value={link}
            onFocus={(e) => e.currentTarget.select()}
            className="min-w-0 flex-1 border border-rule bg-bg px-3 py-2.5 font-mono text-sm text-ink focus:border-accent focus:outline-none"
          />
          <div className="flex gap-2">
            <button type="button" onClick={copy} className="flex-1 bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover sm:flex-none">
              {copied === "ok" ? "Copied" : "Copy link"}
            </button>
            {canShare && (
              <button
                type="button"
                onClick={() => navigator.share({ title: "Websites With Punch", text: "Monitor uptime, SSL and domain expiry for your sites.", url: link }).catch(() => undefined)}
                className="flex-1 border border-rule px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent sm:flex-none"
              >
                Share
              </button>
            )}
          </div>
        </div>
        {copied === "fail" && <p className="mt-1.5 text-xs text-danger">Couldn&apos;t copy. Select the link and copy it manually.</p>}

        <div className="mt-5 grid grid-cols-2 gap-px border border-rule bg-rule lg:grid-cols-4">
          <Stat label="Link visits" value={clicks} sub="First visits via your link" />
          <Stat label="Signups" value={signups} sub="Accounts made via your link" />
          <Stat label="Paying" value={paying} sub="Referrals who have paid" />
          <Stat label="Earned" value={fmtUsd(earned)} sub="All time, excluding reversed" />
        </div>
      </div>
    </section>
  );
}
