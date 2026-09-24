"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PlanId } from "@/lib/plans";
import { PLANS, SITE_PACKS, canBuySitePack, getEffectiveSiteLimit } from "@/lib/plans";
import { useToast } from "@/components/Toast";
import { AddPackModal, RemovePackModal } from "@/components/PackBillingModals";

type Props = {
  plan: PlanId;
  sitePackCount: number;
  siteCount: number;
  atLimit: boolean;
  remaining: number;
  monthlyTotal: number;
};

export function SiteCapacityActions({
  plan,
  sitePackCount,
  siteCount,
  atLimit,
  remaining,
  monthlyTotal,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<"pack" | "business" | "remove" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [modal, setModal] = useState<"add" | "remove" | null>(null);

  const showBilling = plan === "pro" || plan === "business";
  const pack = showBilling ? SITE_PACKS[plan] : null;
  const canBuy = showBilling && canBuySitePack(plan, sitePackCount);
  const showSoftBanner = showBilling && !atLimit && remaining <= 2;
  const canRemove = showBilling && sitePackCount > 0;

  if (!showBilling) return null;

  async function confirmAddPack() {
    setLoading("pack");
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
      setModal(null);
      toast(
        `Site pack added (+${data.sitesPerPack ?? pack?.sitesPerPack ?? 5} sites).`,
        "success",
      );
      router.refresh();
    } catch {
      setMessage("Could not add site pack.");
      toast("Could not add site pack.", "error");
    } finally {
      setLoading(null);
    }
  }

  async function confirmRemovePack() {
    setLoading("remove");
    setMessage(null);
    try {
      const res = await fetch("/api/stripe/remove-pack", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Could not remove pack.");
        toast(data.error || "Could not remove pack.", "error");
        return;
      }
      setModal(null);
      toast("Site pack removed. Limit updated; bill updates next renewal.", "success");
      router.refresh();
    } catch {
      setMessage("Could not remove site pack.");
      toast("Could not remove site pack.", "error");
    } finally {
      setLoading(null);
    }
  }

  async function upgradeBusiness() {
    setLoading("business");
    setMessage(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: "business" }),
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
        toast("Upgraded to Business.", "success");
        router.refresh();
        return;
      }
      setMessage(data.error || "Checkout unavailable.");
      toast(data.error || "Checkout unavailable.", "error");
    } catch {
      setMessage("Upgrade failed.");
      toast("Upgrade failed.", "error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="rounded-none border border-rule bg-bg px-4 py-4">
        <p className="label-caps text-muted">Your plan</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-lg font-medium text-ink">
              {PLANS[plan].name}
              {sitePackCount > 0
                ? ` · ${sitePackCount} pack${sitePackCount === 1 ? "" : "s"}`
                : ""}
            </p>
            <p className="mt-0.5 text-sm text-muted">
              {siteCount}/{getEffectiveSiteLimit(plan, sitePackCount)} sites · ${monthlyTotal}/mo ·
              one bill, same renewal date
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canBuy && (
              <button
                type="button"
                onClick={() => setModal("add")}
                disabled={loading !== null}
                className="rounded-none border border-rule bg-bg px-3 py-1.5 text-sm font-medium text-ink hover:bg-accent-soft disabled:opacity-60"
              >
                Add +{pack!.sitesPerPack} sites
              </button>
            )}
            {canRemove && (
              <button
                type="button"
                onClick={() => setModal("remove")}
                disabled={loading !== null}
                className="rounded-none border border-rule bg-bg px-3 py-1.5 text-sm font-medium text-ink hover:bg-accent-soft disabled:opacity-60"
              >
                Remove a pack
              </button>
            )}
          </div>
        </div>
      </div>

      {showSoftBanner && (
        <div className="rounded-none border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Only {remaining} site slot{remaining === 1 ? "" : "s"} left on {PLANS[plan].name}.{" "}
          {canBuy
            ? `Add a +${pack!.sitesPerPack} site pack for $${pack!.pricePerMonth}/mo when you need more — charged to your existing subscription.`
            : plan === "pro"
              ? "Upgrade to Business for more capacity."
              : "Contact hello@websiteswithpunch.com for custom limits."}
        </div>
      )}

      {atLimit && (
        <div className="rounded-none border border-rule bg-accent-soft px-4 py-4">
          <p className="text-sm font-medium text-ink">Site limit reached ({PLANS[plan].name})</p>
          <p className="mt-1 text-sm text-muted">
            {canBuy
              ? `Add a +${pack!.sitesPerPack} site pack ($${pack!.pricePerMonth}/mo) to your subscription — prorated today, then one monthly bill.`
              : plan === "pro"
                ? "You've used all Pro packs (30 sites). Upgrade to Business for up to 50 sites plus packs."
                : "You've used all Business packs (100 sites). Contact hello@websiteswithpunch.com for a custom limit."}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {canBuy && (
              <button
                type="button"
                onClick={() => setModal("add")}
                disabled={loading !== null}
                className="rounded-none bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
              >
                Buy +{pack!.sitesPerPack} sites — ${pack!.pricePerMonth}/mo
              </button>
            )}
            {plan === "pro" && (
              <button
                type="button"
                onClick={upgradeBusiness}
                disabled={loading !== null}
                className="rounded-none border border-rule bg-bg px-4 py-2 text-sm font-medium text-ink hover:bg-white disabled:opacity-60"
              >
                {loading === "business"
                  ? "Working…"
                  : `Upgrade to Business — $${PLANS.business.price}/mo`}
              </button>
            )}
            {plan === "business" && (
              <a
                href="mailto:hello@websiteswithpunch.com?subject=Custom%20site%20limit"
                className="rounded-none border border-rule bg-bg px-4 py-2 text-sm font-medium text-ink hover:bg-white"
              >
                Contact us
              </a>
            )}
          </div>
          {message && <p className="mt-2 text-xs text-amber-700">{message}</p>}
        </div>
      )}

      <AddPackModal
        open={modal === "add"}
        plan={plan}
        loading={loading === "pack"}
        message={message}
        onClose={() => setModal(null)}
        onConfirm={confirmAddPack}
      />
      <RemovePackModal
        open={modal === "remove"}
        plan={plan}
        sitePackCount={sitePackCount}
        siteCount={siteCount}
        monthlyTotal={monthlyTotal}
        loading={loading === "remove"}
        message={message}
        onClose={() => setModal(null)}
        onConfirm={confirmRemovePack}
      />
    </div>
  );
}
