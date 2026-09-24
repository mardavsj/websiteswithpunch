"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getEffectivePlan } from "@/lib/plans";
import { useToast } from "@/components/Toast";
import { UpgradePlanModal } from "@/components/UpgradePlanModal";

export function NavUpgradeButtons() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<"pro" | "business" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (!session?.user) return null;
  const plan = getEffectivePlan(session.user.plan, session.user.stripeStatus ?? null);
  if (plan === "business") return null;

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

  if (plan === "pro") {
    return (
      <>
        <button
          type="button"
          onClick={() => setUpgradeOpen(true)}
          disabled={loading !== null}
          className="rounded-none bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          Upgrade to Business
        </button>
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
    <>
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
    </>
  );
}
