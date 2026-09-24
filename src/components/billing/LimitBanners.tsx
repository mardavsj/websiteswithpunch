"use client";

import { PLANS } from "@/lib/plans";
import { SITE_PACKS } from "@/lib/plans";

type Props = {
  plan: "pro" | "business";
  atLimit: boolean;
  remaining: number;
  canBuy: boolean;
  loading: boolean;
  message: string | null;
  onAdd: () => void;
  onUpgrade: () => void;
};

export function LimitBanners({
  plan,
  atLimit,
  remaining,
  canBuy,
  loading,
  message,
  onAdd,
  onUpgrade,
}: Props) {
  const pack = SITE_PACKS[plan];
  const showSoft = !atLimit && remaining <= 2;
  return (
    <>
      {showSoft && (
        <div className="mt-3 rounded-none border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Only {remaining} site slot{remaining === 1 ? "" : "s"} left on {PLANS[plan].name}.{" "}
          {canBuy
            ? `Add a +${pack.sitesPerPack} site pack for $${pack.pricePerMonth}/mo when you need more.`
            : plan === "pro"
              ? "Upgrade to Business for more capacity."
              : "Contact hello@websiteswithpunch.com for custom limits."}
        </div>
      )}
      {atLimit && (
        <div className="mt-3 rounded-none border border-rule bg-accent-soft px-4 py-4">
          <p className="text-sm font-medium text-ink">Site limit reached ({PLANS[plan].name})</p>
          <p className="mt-1 text-sm text-muted">
            {canBuy
              ? `Add a +${pack.sitesPerPack} site pack ($${pack.pricePerMonth}/mo) to your subscription.`
              : plan === "pro"
                ? "You've used all Pro packs (30 sites). Upgrade to Business for up to 50 sites plus packs."
                : "You've used all Business packs (100 sites). Contact hello@websiteswithpunch.com for a custom limit."}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {canBuy && (
              <button
                type="button"
                onClick={onAdd}
                disabled={loading}
                className="rounded-none bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
              >
                Buy +{pack.sitesPerPack} sites — ${pack.pricePerMonth}/mo
              </button>
            )}
            {plan === "pro" && (
              <button
                type="button"
                onClick={onUpgrade}
                disabled={loading}
                className="rounded-none border border-rule bg-bg px-4 py-2 text-sm font-medium text-ink hover:bg-white disabled:opacity-60"
              >
                Upgrade to Business — ${PLANS.business.price}/mo
              </button>
            )}
          </div>
          {message && <p className="mt-2 text-xs text-amber-700">{message}</p>}
        </div>
      )}
    </>
  );
}
