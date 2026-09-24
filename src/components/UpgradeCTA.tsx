"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PlanId } from "@/lib/plans";
import { PLANS } from "@/lib/plans";
import { useToast } from "@/components/Toast";
import { UpgradePlanModal } from "@/components/UpgradePlanModal";

export function UpgradeCTA({ plan }: { plan: PlanId | string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<"pro" | "business" | "portal" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  async function openPortal() {
    setLoading("portal");
    setMessage(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setMessage(data.error || "Billing portal unavailable.");
    } catch {
      setMessage("Could not open billing portal.");
    } finally {
      setLoading(null);
    }
  }

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
        toast(
          planId === "business" ? "Upgraded to Business." : "Upgraded to Pro.",
          "success",
        );
        router.refresh();
        return;
      }
      setMessage(data.error || "Checkout is not configured yet.");
      toast(data.error || "Checkout is not configured yet.", "error");
    } catch {
      setMessage("Checkout failed. Check billing configuration.");
      toast("Checkout failed. Check billing configuration.", "error");
    } finally {
      setLoading(null);
    }
  }

  if (plan === "business") {
    return (
      <div className="space-y-2">
        <button
          onClick={openPortal}
          disabled={loading !== null}
          className="rounded-none border border-rule bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-accent-soft disabled:opacity-60"
        >
          {loading === "portal" ? "Opening…" : "Manage billing"}
        </button>
        {message && <p className="text-xs text-amber-700 dark:text-amber-300">{message}</p>}
      </div>
    );
  }

  if (plan === "pro") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={openPortal}
          disabled={loading !== null}
          className="rounded-none border border-rule bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-accent-soft disabled:opacity-60"
        >
          {loading === "portal" ? "Opening…" : "Manage billing"}
        </button>
        <button
          onClick={() => setUpgradeOpen(true)}
          disabled={loading !== null}
          className="rounded-none bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          Upgrade to Business — ${PLANS.business.price}/mo
        </button>
        {message && <p className="basis-full text-xs text-amber-700 dark:text-amber-300">{message}</p>}
        <UpgradePlanModal
          open={upgradeOpen}
          loading={loading === "business"}
          message={message}
          onClose={() => setUpgradeOpen(false)}
          onConfirm={() => checkout("business")}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => checkout("pro")}
        disabled={loading !== null}
        className="rounded-none bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {loading === "pro" ? "Redirecting…" : `Upgrade to Pro — $${PLANS.pro.price}/mo`}
      </button>
      <button
        onClick={() => checkout("business")}
        disabled={loading !== null}
        className="rounded-none border border-rule bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-accent-soft disabled:opacity-60"
      >
        {loading === "business"
          ? "Redirecting…"
          : `Business — $${PLANS.business.price}/mo`}
      </button>
      {message && <p className="basis-full text-xs text-amber-700 dark:text-amber-300">{message}</p>}
    </div>
  );
}
