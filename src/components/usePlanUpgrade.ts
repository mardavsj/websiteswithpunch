"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getEffectivePlan, type PlanId } from "@/lib/plans";
import { useToast } from "@/components/Toast";

export function usePlanUpgrade() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<"pro" | "business" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const plan: PlanId | null = session?.user
    ? getEffectivePlan(session.user.plan, session.user.stripeStatus ?? null)
    : null;

  async function checkout(planId: "pro" | "business") {
    setLoading(planId);
    setMessage(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.hostedInvoiceUrl || data.requiresAction) {
        window.location.href = data.hostedInvoiceUrl;
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.ok) {
        setUpgradeOpen(false);
        toast(planId === "business" ? "Upgraded to Business." : "Upgraded to Pro.", "success");
        router.refresh();
        return;
      }
      setMessage(data.error || "Checkout unavailable.");
      toast(data.error || "Checkout unavailable.", "error");
    } catch {
      toast("Checkout failed.", "error");
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
    checkout,
    showUpgrades: plan === "free" || plan === "pro",
  };
}
