"use client";

import { readJson } from "@/lib/read-json";
import { useRouter } from "next/navigation";
import { PLANS, type PlanId } from "@/lib/plans";
import { useToast } from "@/components/Toast";
import { BILLING_CHANGED } from "@/components/billing/useBillingSummary";
import { PENDING_MESSAGE, STILL_PENDING_MESSAGE, awaitBilling } from "@/components/billing/awaitBilling";

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
    window.dispatchEvent(new Event(BILLING_CHANGED));
    router.refresh();
  }

  async function confirmCancel(keepSiteIds: string[]) {
    const res = await fetch("/api/billing/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keepSiteIds }),
    });
    const data = await readJson(res);
    if (!res.ok) {
      toast(data.error || "Could not cancel.", "error");
      return false;
    }
    toast(
      `You keep ${PLANS[plan].name} until ${data.pendingPlanAtFormatted || "the end of the period you've paid for"}. After that you're on Free (1 site). No more payments.`,
      "success",
    );
    await afterOk();
    return true;
  }

  async function resumePlan() {
    const res = await fetch("/api/billing/resume", { method: "POST" });
    const data = await readJson(res);
    if (!res.ok) {
      toast(data.error || "Could not resume.", "error");
      return false;
    }
    toast("Plan resumed.", "success");
    await afterOk();
    return true;
  }

  async function confirmDowngrade(keepSiteIds: string[]) {
    const res = await fetch("/api/billing/downgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keepSiteIds }),
    });
    const data = await readJson(res);
    if (!res.ok) {
      toast(data.error || "Could not downgrade.", "error");
      return false;
    }
    toast(
      `Nothing is charged today. You keep Business until ${data.pendingPlanAtFormatted || "renewal"}. From then you'll pay ${data.newRecurringFormatted || "the Pro price"}.`,
      "success",
    );
    await afterOk();
    return true;
  }

  async function previewNeedsKeepPicker(): Promise<boolean | null> {
    try {
      const res = await fetch("/api/billing/preview-downgrade");
      const data = await readJson(res);
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
    const data = await readJson(res);
    if (!res.ok) {
      toast(data.error || "Could not update.", "error");
      return false;
    }
    toast("Selection saved for when your plan changes.", "success");
    await afterOk();
    return true;
  }

  /** Same plan, monthly → annual (in place; Dodo charges the year minus the unused month). */
  async function switchToAnnual(): Promise<string | null> {
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan, interval: "annual" }),
      });
      const data = await readJson(res);
      if (!res.ok || !data.ok) return data.error || "Could not switch to annual billing.";
      if (data.pending) {
        toast(PENDING_MESSAGE, "info");
        void awaitBilling((s) => s.interval === "year").then(async (ok) => {
          toast(ok ? "You're now on annual billing." : STILL_PENDING_MESSAGE, ok ? "success" : "info");
          await afterOk();
        });
        return null;
      }
      toast("You're now on annual billing.", "success");
      await afterOk();
      return null;
    } catch {
      return "Could not switch to annual billing.";
    }
  }

  /** Annual → monthly at renewal (subscription schedule). Returns an error message or null. */
  async function scheduleMonthly(): Promise<string | null> {
    try {
      const res = await fetch("/api/billing/switch-interval", { method: "POST" });
      const data = await readJson(res);
      if (!res.ok) return data.error || "Could not schedule the switch to monthly.";
      toast(
        `Switch scheduled. You keep annual billing until ${data.switchAtFormatted || "your renewal date"}, then pay monthly.`,
        "success",
      );
      await afterOk();
      return null;
    } catch {
      return "Could not schedule the switch to monthly.";
    }
  }

  async function cancelMonthlySwitch() {
    const res = await fetch("/api/billing/switch-interval", { method: "DELETE" });
    const data = await readJson(res).catch(() => ({}));
    if (!res.ok) {
      toast(data.error || "Could not cancel the switch.", "error");
      return false;
    }
    toast("Switch canceled. You stay on annual billing.", "success");
    await afterOk();
    return true;
  }

  async function undoPendingRemoval() {
    const res = await fetch("/api/billing/checkout-pack", { method: "POST" });
    const data = await readJson(res);
    if (!res.ok) {
      toast(data.error || "Could not undo.", "error");
      return false;
    }
    toast("Pack removal canceled.", "success");
    await afterOk();
    return true;
  }

  /** A dropped connection shows a toast instead of failing silently (resolves to null). */
  function safe<A extends unknown[], R>(fn: (...args: A) => Promise<R>) {
    return async (...args: A): Promise<R | null> => {
      try {
        return await fn(...args);
      } catch {
        toast("Couldn't reach billing. Check your connection and try again.", "error");
        return null;
      }
    };
  }

  return {
    confirmCancel: safe(confirmCancel),
    resumePlan: safe(resumePlan),
    confirmDowngrade: safe(confirmDowngrade),
    previewNeedsKeepPicker: safe(previewNeedsKeepPicker),
    confirmPendingKeep: safe(confirmPendingKeep),
    switchToAnnual: safe(switchToAnnual),
    scheduleMonthly: safe(scheduleMonthly),
    cancelMonthlySwitch: safe(cancelMonthlySwitch),
    undoPendingRemoval: safe(undoPendingRemoval),
  };
}
