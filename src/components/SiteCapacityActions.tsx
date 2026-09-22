"use client";

import { useState } from "react";
import type { PlanId } from "@/lib/plans";
import { PLANS, SITE_PACKS, canBuySitePack } from "@/lib/plans";

type Props = {
  plan: PlanId;
  sitePackCount: number;
  atLimit: boolean;
  remaining: number;
};

export function SiteCapacityActions({ plan, sitePackCount, atLimit, remaining }: Props) {
  const [loading, setLoading] = useState<"pack" | "business" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (plan !== "pro" && plan !== "business") return null;

  const pack = SITE_PACKS[plan];
  const canBuy = canBuySitePack(plan, sitePackCount);
  const showSoftBanner = !atLimit && remaining <= 2;

  if (!showSoftBanner && !atLimit) return null;

  async function buyPack() {
    setLoading("pack");
    setMessage(null);
    try {
      const res = await fetch("/api/stripe/checkout-pack", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setMessage(data.error || "Pack checkout is not configured yet.");
    } catch {
      setMessage("Could not start pack checkout.");
    } finally {
      setLoading(null);
    }
  }

  async function upgradeBusiness() {
    setLoading("business");
    setMessage(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: "business" }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setMessage(data.error || "Checkout unavailable.");
    } catch {
      setMessage("Upgrade checkout failed.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-6 space-y-3">
      {showSoftBanner && (
        <div className="rounded-none border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Only {remaining} site slot{remaining === 1 ? "" : "s"} left on {PLANS[plan].name}.{" "}
          {canBuy
            ? `Add a +${pack.sitesPerPack} site pack for $${pack.pricePerMonth}/mo when you need more.`
            : plan === "pro"
              ? "Upgrade to Business for more capacity."
              : "Contact hello@websiteswithpunch.com for custom limits."}
        </div>
      )}

      {atLimit && (
        <div className="rounded-none border border-rule bg-accent-soft px-4 py-4">
          <p className="text-sm font-medium text-ink">Site limit reached ({PLANS[plan].name})</p>
          <p className="mt-1 text-sm text-muted">
            {canBuy
              ? `Buy a +${pack.sitesPerPack} site pack ($${pack.pricePerMonth}/mo) to keep monitoring more URLs.`
              : plan === "pro"
                ? "You've used all Pro packs (30 sites). Upgrade to Business for up to 50 sites plus packs."
                : "You've used all Business packs (100 sites). Contact hello@websiteswithpunch.com for a custom limit."}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {canBuy && (
              <button
                type="button"
                onClick={buyPack}
                disabled={loading !== null}
                className="rounded-none bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
              >
                {loading === "pack"
                  ? "Redirecting…"
                  : `Buy +${pack.sitesPerPack} sites — $${pack.pricePerMonth}/mo`}
              </button>
            )}
            {plan === "pro" && (
              <button
                type="button"
                onClick={upgradeBusiness}
                disabled={loading !== null}
                className="rounded-none border border-rule bg-bg px-4 py-2 text-sm font-medium text-ink hover:bg-white disabled:opacity-60"
              >
                {loading === "business"
                  ? "Redirecting…"
                  : `Upgrade to Business — $${PLANS.business.price}/mo`}
              </button>
            )}
            {plan === "business" && (
              <a
                href="mailto:hello@websiteswithpunch.com?subject=Custom%20site%20limit"
                className="rounded-none border border-rule bg-bg px-4 py-2 text-sm font-medium text-ink hover:bg-white"
              >
                Contact us
              </a>
            )}
          </div>
          {message && <p className="mt-2 text-xs text-amber-700">{message}</p>}
        </div>
      )}
    </div>
  );
}
