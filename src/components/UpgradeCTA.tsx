"use client";

import { useState } from "react";
import type { PlanId } from "@/lib/plans";
import { UpgradeModals } from "@/components/UpgradeModals";
import { usePlanUpgrade } from "@/components/usePlanUpgrade";

const outlineBtn =
  "rounded-none border border-rule bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-accent-soft disabled:opacity-60";
const accentBtn =
  "rounded-none bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60";

/** /plan upgrade buttons. Each opens a window where you pick Monthly or Annual first. */
export function UpgradeCTA({ plan }: { plan: PlanId | string }) {
  const current: PlanId = plan === "pro" || plan === "business" ? plan : "free";
  const upgrade = usePlanUpgrade(current);
  const { loading, setUpgradeOpen, startCheckout } = upgrade;
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalMessage, setPortalMessage] = useState<string | null>(null);

  async function openPortal() {
    setPortalLoading(true);
    setPortalMessage(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setPortalMessage(data.error || "Billing portal unavailable.");
    } catch {
      setPortalMessage("Could not open billing portal.");
    } finally {
      setPortalLoading(false);
    }
  }

  const busy = loading !== null || portalLoading;
  const portalButton = (
    <button onClick={openPortal} disabled={busy} className={outlineBtn}>
      {portalLoading ? "Opening…" : "Manage billing"}
    </button>
  );
  const portalNote = portalMessage && (
    <p className="basis-full text-xs text-amber-700 dark:text-amber-300">{portalMessage}</p>
  );

  if (current === "business") {
    return (
      <div className="space-y-2">
        {portalButton}
        {portalNote}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {current === "pro" ? (
        <>
          {portalButton}
          <button onClick={() => setUpgradeOpen(true)} disabled={busy} className={accentBtn}>
            Upgrade to Business
          </button>
        </>
      ) : (
        <>
          <button onClick={() => startCheckout("pro")} disabled={busy} className={accentBtn}>
            Upgrade to Pro
          </button>
          <button onClick={() => startCheckout("business")} disabled={busy} className={outlineBtn}>
            Upgrade to Business
          </button>
        </>
      )}
      {portalNote}
      <UpgradeModals upgrade={upgrade} />
    </div>
  );
}
