"use client";

import { UpgradeModals } from "@/components/UpgradeModals";
import { usePlanUpgrade } from "@/components/usePlanUpgrade";

export function NavUpgradeButtons() {
  const upgrade = usePlanUpgrade();
  const { plan, loading, setUpgradeOpen, startCheckout, showUpgrades } = upgrade;

  if (!showUpgrades) return null;

  return (
    <>
      {plan === "pro" ? (
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
      ) : (
        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => startCheckout("pro")}
            disabled={loading !== null}
            className="rounded-none bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
          >
            Upgrade to Pro
          </button>
          <button
            type="button"
            onClick={() => startCheckout("business")}
            disabled={loading !== null}
            className="rounded-none border border-rule px-3 py-1.5 text-sm font-medium text-ink hover:bg-accent-soft disabled:opacity-60"
          >
            Upgrade to Business
          </button>
        </div>
      )}
      <UpgradeModals upgrade={upgrade} />
    </>
  );
}
