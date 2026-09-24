"use client";

import { UpgradePlanModal } from "@/components/UpgradePlanModal";
import { usePlanUpgrade } from "@/components/usePlanUpgrade";

export function NavUpgradeButtons() {
  const { plan, loading, message, upgradeOpen, setUpgradeOpen, checkout, showUpgrades } =
    usePlanUpgrade();

  if (!showUpgrades) return null;

  if (plan === "pro") {
    return (
      <>
        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => setUpgradeOpen(true)}
            disabled={loading !== null}
            className="rounded-none bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
          >
            Upgrade to Business
          </button>
        </div>
        <UpgradePlanModal
          open={upgradeOpen}
          loading={loading === "business"}
          message={message}
          onClose={() => setUpgradeOpen(false)}
          onConfirm={() => checkout("business")}
        />
      </>
    );
  }

  return (
    <div className="hidden items-center gap-2 md:flex">
      <button
        type="button"
        onClick={() => checkout("pro")}
        disabled={loading !== null}
        className="rounded-none bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {loading === "pro" ? "…" : "Upgrade to Pro"}
      </button>
      <button
        type="button"
        onClick={() => checkout("business")}
        disabled={loading !== null}
        className="rounded-none border border-rule px-3 py-1.5 text-sm font-medium text-ink hover:bg-accent-soft disabled:opacity-60"
      >
        {loading === "business" ? "…" : "Upgrade to Business"}
      </button>
    </div>
  );
}
