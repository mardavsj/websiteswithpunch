"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getEffectivePlan, type PlanId } from "@/lib/plans";
import { upgradeTargets } from "@/lib/upgrade-targets";
import { intervalParam, type BillingInterval } from "@/lib/billing-interval";
import { useToast } from "@/components/Toast";
import { PENDING_MESSAGE, STILL_PENDING_MESSAGE, awaitBilling } from "@/components/billing/awaitBilling";

/**
 * Upgrade state shared by the navbar, profile menu and /plan:
 * - startCheckout(plan) opens the Monthly / Annual window for a new subscription (Free users)
 * - setUpgradeOpen(true) opens the Pro → Business window (in-place change)
 * Render both windows with <UpgradeModals {...upgrade} />.
 */
export function usePlanUpgrade(planOverride?: PlanId) {
  const { data: session, update } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<"pro" | "business" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpenState] = useState(false);
  const [choosePlan, setChoosePlanState] = useState<"pro" | "business" | null>(null);

  const plan: PlanId | null =
    planOverride ??
    (session?.user ? getEffectivePlan(session.user.plan, session.user.dodoStatus ?? null) : null);

  function setUpgradeOpen(open: boolean) {
    setMessage(null);
    setUpgradeOpenState(open);
  }

  function setChoosePlan(planId: "pro" | "business" | null) {
    setMessage(null);
    setChoosePlanState(planId);
  }

  async function checkout(planId: "pro" | "business", interval: BillingInterval = "month") {
    setLoading(planId);
    setMessage(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, interval: intervalParam(interval) }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.ok) {
        setUpgradeOpenState(false);
        setChoosePlanState(null);
        const doneMsg = planId === "business" ? "Upgraded to Business." : "Switched to annual billing.";
        if (!data.pending) {
          toast(doneMsg, "success");
          void update(); // navbar plan comes from the session
          router.refresh();
          return;
        }
        toast(PENDING_MESSAGE, "info");
        const ok = await awaitBilling((s) => s.plan === planId && s.interval === interval);
        toast(ok ? doneMsg : STILL_PENDING_MESSAGE, ok ? "success" : "info");
        void update();
        router.refresh();
        return;
      }
      setMessage(data.error || "Checkout unavailable.");
    } catch {
      setMessage("Checkout failed. Try again in a moment.");
    } finally {
      setLoading(null);
    }
  }

  return {
    plan,
    loading,
    message,
    upgradeOpen,
    setUpgradeOpen,
    choosePlan,
    setChoosePlan,
    startCheckout: (planId: "pro" | "business") => setChoosePlan(planId),
    checkout,
    /** "Upgrade to …" buttons this plan may show (none on Business). */
    targets: upgradeTargets(plan),
    showUpgrades: upgradeTargets(plan).length > 0,
  };
}

export type PlanUpgrade = ReturnType<typeof usePlanUpgrade>;
