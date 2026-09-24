"use client";

import { useRouter } from "next/navigation";
import { PLANS, type PlanId } from "@/lib/plans";
import { useToast } from "@/components/Toast";

type ToastFn = ReturnType<typeof useToast>["toast"];

export function useBillingActions(opts: {
  plan: PlanId;
  loadSummary: () => Promise<void>;
  toast: ToastFn;
}) {
  const router = useRouter();
  const { plan, loadSummary, toast } = opts;

  async function afterOk() {
    await loadSummary();
    router.refresh();
  }

  async function confirmCancel(keepSiteIds: string[]) {
    const res = await fetch("/api/stripe/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keepSiteIds }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error || "Could not cancel.", "error");
      return false;
    }
    toast(
      `You keep ${PLANS[plan].name} until ${data.pendingPlanAtFormatted || "the end of the month"}. After that you're on Free (1 site). No more payments.`,
      "success",
    );
    await afterOk();
    return true;
  }

  async function resumePlan() {
    const res = await fetch("/api/stripe/resume", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error || "Could not resume.", "error");
      return false;
    }
    toast("Plan resumed.", "success");
    await afterOk();
    return true;
  }

  async function confirmDowngrade(keepSiteIds: string[]) {
    const res = await fetch("/api/stripe/downgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keepSiteIds }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error || "Could not downgrade.", "error");
      return false;
    }
    toast(
      `Nothing is charged or refunded today. You keep Business until ${data.pendingPlanAtFormatted || "renewal"}. From then you'll pay $12/month.`,
      "success",
    );
    await afterOk();
    return true;
  }

  async function previewNeedsKeepPicker(): Promise<boolean | null> {
    try {
      const res = await fetch("/api/stripe/preview-downgrade");
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Could not load preview.", "error");
        return null;
      }
      return Boolean(data.needsKeepPicker);
    } catch {
      toast("Could not start downgrade.", "error");
      return null;
    }
  }

  async function confirmPendingKeep(siteIds: string[]): Promise<boolean> {
    const res = await fetch("/api/sites/choose-active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteIds }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error || "Could not update.", "error");
      return false;
    }
    toast("Selection saved for when your plan changes.", "success");
    await afterOk();
    return true;
  }

  async function undoPendingRemoval() {
    const res = await fetch("/api/stripe/checkout-pack", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error || "Could not undo.", "error");
      return false;
    }
    toast("Pack removal canceled.", "success");
    await afterOk();
    return true;
  }

  return {
    confirmCancel,
    resumePlan,
    confirmDowngrade,
    previewNeedsKeepPicker,
    confirmPendingKeep,
    undoPendingRemoval,
  };
}
