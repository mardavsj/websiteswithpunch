"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PlanId } from "@/lib/plans";
import { PLANS, SITE_PACKS, canBuySitePack } from "@/lib/plans";
import { useToast } from "@/components/Toast";
import {
  AddPackModal,
  RemovePackModal,
  UpgradePlanModal,
} from "@/components/PackBillingModals";

type BillingSummary = {
  plan: PlanId;
  planName: string;
  sitePackCount: number;
  siteLimit: number;
  monthlyTotalFormatted: string;
  nextPaymentDateFormatted: string | null;
  hasPendingRemoval: boolean;
  pendingSitesToRemove: number;
  pendingPackChangeAtFormatted: string | null;
};

type KeepSiteOption = { id: string; name: string; url: string; createdAt: string };

type Props = {
  plan: PlanId;
  sitePackCount: number;
  siteCount: number;
  siteLimit: number;
  atLimit: boolean;
  remaining: number;
  overLimit?: boolean;
  keepOptions?: KeepSiteOption[];
  allSiteOptions?: (KeepSiteOption & { locked?: boolean })[];
  cancelAtPeriodEnd?: boolean;
  pendingPlan?: string | null;
  pendingPlanAt?: string | null;
};

export function SiteCapacityActions({
  plan,
  sitePackCount,
  siteCount,
  siteLimit,
  atLimit,
  remaining,
  overLimit = false,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<"pack" | "business" | "remove" | "undo" | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [modal, setModal] = useState<"add" | "remove" | "upgrade" | null>(null);
  const [summary, setSummary] = useState<BillingSummary | null>(null);

  const showBilling = plan === "pro" || plan === "business";
  const pack = showBilling ? SITE_PACKS[plan] : null;

  const loadSummary = useCallback(async () => {
    if (!showBilling) return;
    try {
      const res = await fetch("/api/stripe/billing-summary");
      if (!res.ok) return;
      const data = (await res.json()) as BillingSummary;
      setSummary(data);
    } catch {
      // omit gracefully
    }
  }, [showBilling]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary, sitePackCount]);

  const hasPending = summary?.hasPendingRemoval ?? false;
  const pendingSites = summary?.pendingSitesToRemove ?? 0;
  const pendingDate = summary?.pendingPackChangeAtFormatted;
  const effectivePacks = summary?.sitePackCount ?? sitePackCount;
  const effectiveLimit = summary?.siteLimit ?? siteLimit;

  const allPacksScheduledAway =
    hasPending && pendingSites >= effectivePacks * (pack?.sitesPerPack || 5);
  const canBuy = showBilling && (hasPending || canBuySitePack(plan, effectivePacks));
  const showSoftBanner = showBilling && !atLimit && !overLimit && remaining <= 2;
  const canRemove = showBilling && effectivePacks > 0 && !allPacksScheduledAway;

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
        data.undone
          ? "Pack removal canceled. Your sites stay on your plan."
          : `Added ${data.sitesPerPack ?? pack?.sitesPerPack ?? 5} sites.`,
        "success",
      );
      await loadSummary();
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
      toast(
        `Removal scheduled. You keep your sites until the end of the month you've paid for.`,
        "success",
      );
      await loadSummary();
      router.refresh();
    } catch {
      setMessage("Could not remove site pack.");
      toast("Could not remove site pack.", "error");
    } finally {
      setLoading(null);
    }
  }

  async function undoPendingRemoval() {
    setLoading("undo");
    setMessage(null);
    try {
      const res = await fetch("/api/stripe/checkout-pack", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Could not undo.", "error");
        return;
      }
      toast("Pack removal canceled.", "success");
      await loadSummary();
      router.refresh();
    } catch {
      toast("Could not undo.", "error");
    } finally {
      setLoading(null);
    }
  }

  async function confirmUpgrade() {
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
        setModal(null);
        toast("Upgraded to Business.", "success");
        await loadSummary();
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

  const nextPaymentLine =
    summary?.nextPaymentDateFormatted && summary.monthlyTotalFormatted
      ? `Next payment: ${summary.monthlyTotalFormatted.replace("/month", "")} on ${summary.nextPaymentDateFormatted}`
      : null;

  return (
    <div className="mt-6 space-y-3">
      <div className="rounded-none border border-rule bg-bg px-4 py-4">
        <p className="label-caps text-muted">Your plan</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-lg font-medium text-ink">
              {PLANS[plan].name}
              {effectivePacks > 0
                ? ` · ${effectivePacks} pack${effectivePacks === 1 ? "" : "s"}`
                : ""}
            </p>
            <p className="mt-0.5 text-sm text-muted">
              {siteCount}/{effectiveLimit} sites
              {summary?.monthlyTotalFormatted
                ? ` · ${summary.monthlyTotalFormatted}`
                : ""}
            </p>
            {nextPaymentLine && (
              <p className="mt-0.5 text-sm text-muted">{nextPaymentLine}</p>
            )}
            {hasPending && pendingSites > 0 && pendingDate && (
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-amber-900">
                <span>
                  {pendingSites} site{pendingSites === 1 ? "" : "s"} will be locked on{" "}
                  {pendingDate}
                </span>
                <button
                  type="button"
                  onClick={undoPendingRemoval}
                  disabled={loading !== null}
                  className="rounded-none border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-950 hover:bg-amber-100 disabled:opacity-60"
                >
                  {loading === "undo" ? "Working…" : "Undo"}
                </button>
              </p>
            )}
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
                Remove {pack!.sitesPerPack} sites
              </button>
            )}
          </div>
        </div>
      </div>

      {overLimit && (
        <div className="rounded-none border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          You have {siteCount} sites but your plan now includes {effectiveLimit}. Remove{" "}
          {siteCount - effectiveLimit} site{siteCount - effectiveLimit === 1 ? "" : "s"} or
          add a pack. Extra sites are locked until you free a slot or upgrade.
        </div>
      )}

      {showSoftBanner && (
        <div className="rounded-none border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Only {remaining} site slot{remaining === 1 ? "" : "s"} left on {PLANS[plan].name}.{" "}
          {canBuy
            ? `Add a +${pack!.sitesPerPack} site pack for $${pack!.pricePerMonth}/mo when you need more.`
            : plan === "pro"
              ? "Upgrade to Business for more capacity."
              : "Contact hello@websiteswithpunch.com for custom limits."}
        </div>
      )}

      {atLimit && !overLimit && (
        <div className="rounded-none border border-rule bg-accent-soft px-4 py-4">
          <p className="text-sm font-medium text-ink">Site limit reached ({PLANS[plan].name})</p>
          <p className="mt-1 text-sm text-muted">
            {canBuy
              ? `Add a +${pack!.sitesPerPack} site pack ($${pack!.pricePerMonth}/mo) to your subscription.`
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
                onClick={() => setModal("upgrade")}
                disabled={loading !== null}
                className="rounded-none border border-rule bg-bg px-4 py-2 text-sm font-medium text-ink hover:bg-white disabled:opacity-60"
              >
                Upgrade to Business — ${PLANS.business.price}/mo
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
        loading={loading === "remove"}
        message={message}
        onClose={() => setModal(null)}
        onConfirm={confirmRemovePack}
      />
      <UpgradePlanModal
        open={modal === "upgrade"}
        loading={loading === "business"}
        message={message}
        onClose={() => setModal(null)}
        onConfirm={confirmUpgrade}
      />
    </div>
  );
}
