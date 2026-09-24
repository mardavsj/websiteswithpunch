"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SITE_PACKS, canBuySitePack, type PlanId } from "@/lib/plans";
import { useToast } from "@/components/Toast";
import { AddPackModal } from "@/components/PackBillingModals";

export function DashboardPackCta({
  plan,
  sitePackCount,
}: {
  plan: PlanId;
  sitePackCount: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (plan !== "pro" && plan !== "business") return null;

  const pack = SITE_PACKS[plan];
  const canBuy = canBuySitePack(plan, sitePackCount);
  const label = `Buy +${pack.sitesPerPack} site slots`;

  async function confirm() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/stripe/checkout-pack", { method: "POST" });
      const data = await res.json();
      if (data.hostedInvoiceUrl || data.requiresAction) {
        window.location.href = data.hostedInvoiceUrl;
        return;
      }
      if (!res.ok) {
        setMessage(data.error || "Could not add pack.");
        toast(data.error || "Could not add pack.", "error");
        return;
      }
      setOpen(false);
      toast(
        data.undone
          ? "Pack removal canceled. Your sites stay on your plan."
          : `Added ${data.sitesPerPack ?? pack.sitesPerPack} sites.`,
        "success",
      );
      router.refresh();
    } catch {
      setMessage("Could not add site pack.");
      toast("Could not add site pack.", "error");
    } finally {
      setLoading(false);
    }
  }

  if (!canBuy) {
    return (
      <span
        title="Contact hello@websiteswithpunch.com for custom limits."
        className="rounded-none border border-rule bg-accent-soft px-4 py-2 text-sm text-muted"
      >
        Max packs reached
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={loading}
        className="rounded-none border border-rule bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-accent-soft disabled:opacity-60"
      >
        {label}
      </button>
      <AddPackModal
        open={open}
        plan={plan}
        loading={loading}
        message={message}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
      />
    </>
  );
}
