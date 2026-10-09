"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SITE_PACKS } from "@/lib/plans";
import { useToast } from "@/components/Toast";
import { PENDING_MESSAGE, STILL_PENDING_MESSAGE, awaitBilling } from "@/components/billing/awaitBilling";
import {
  AddPackModal,
  RemovePackModal,
  UpgradePlanModal,
} from "@/components/PackBillingModals";
import { KeepSitesPicker, type KeepSiteOption } from "@/components/KeepSitesPicker";
import { LimitBanners } from "@/components/billing/LimitBanners";
import { NoRefundNote } from "@/components/billing/modal-bits";
import { intervalParam, type BillingInterval } from "@/lib/billing-interval";

type Props = {
  plan: "pro" | "business";
  siteCount: number;
  siteLimit: number;
  canBuy: boolean;
  canRemove: boolean;
  atLimit: boolean;
  remaining: number;
  keepOptions: KeepSiteOption[];
  /** Subscription interval from /api/billing/summary; packs and prices follow it. */
  interval?: BillingInterval;
  onRefresh: () => Promise<void>;
};

export function PackActions({
  plan,
  siteCount,
  siteLimit,
  canBuy,
  canRemove,
  atLimit,
  remaining,
  keepOptions,
  interval = "month",
  onRefresh,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const pack = SITE_PACKS[plan];
  const [loading, setLoading] = useState<"pack" | "business" | "remove" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [modal, setModal] = useState<"add" | "remove" | "upgrade" | "remove-keep" | null>(null);
  const [removePreview, setRemovePreview] = useState<{ maxKeep: number; renew: string } | null>(
    null,
  );

  async function confirmAddPack() {
    setLoading("pack");
    setMessage(null);
    try {
      const res = await fetch("/api/billing/checkout-pack", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Could not add pack.");
        toast(data.error || "Could not add pack.", "error");
        return;
      }
      setModal(null);
      const added = `Added ${data.sitesPerPack ?? pack.sitesPerPack} sites.`;
      if (data.pending) {
        toast(PENDING_MESSAGE, "info");
        const ok = await awaitBilling((s) => s.sitePackCount > (data.sitePackCount ?? 0));
        toast(ok ? added : STILL_PENDING_MESSAGE, ok ? "success" : "info");
      } else {
        toast(data.undone ? "Pack removal canceled. Your sites stay on your plan." : added, "success");
      }
      await onRefresh();
      router.refresh();
    } catch {
      setMessage("Could not add site pack.");
      toast("Could not add site pack.", "error");
    } finally {
      setLoading(null);
    }
  }

  async function startRemovePack() {
    try {
      const res = await fetch("/api/billing/preview-pack?action=remove");
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Could not load preview.", "error");
        return;
      }
      const newLimit = data.newSiteLimitFromRenewal as number;
      if (siteCount > newLimit) {
        setRemovePreview({
          maxKeep: newLimit,
          renew: data.nextRenewalFormatted || "your next billing date",
        });
        setModal("remove-keep");
      } else {
        setModal("remove");
      }
    } catch {
      toast("Could not load preview.", "error");
    }
  }

  async function confirmRemovePack(keepSiteIds?: string[]) {
    setLoading("remove");
    setMessage(null);
    try {
      const res = await fetch("/api/billing/remove-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(keepSiteIds ? { keepSiteIds } : {}),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Could not remove pack.");
        toast(data.error || "Could not remove pack.", "error");
        return;
      }
      setModal(null);
      toast(
        `Removal scheduled. You keep your sites until the end of the ${interval === "year" ? "year" : "month"} you've paid for.`,
        "success",
      );
      await onRefresh();
      router.refresh();
    } catch {
      toast("Could not remove site pack.", "error");
    } finally {
      setLoading(null);
    }
  }

  async function confirmUpgrade(nextInterval: BillingInterval) {
    setLoading("business");
    setMessage(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: "business", interval: intervalParam(nextInterval) }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.ok) {
        setModal(null);
        if (data.pending) {
          toast(PENDING_MESSAGE, "info");
          const ok = await awaitBilling((s) => s.plan === "business");
          toast(ok ? "Upgraded to Business." : STILL_PENDING_MESSAGE, ok ? "success" : "info");
        } else {
          toast("Upgraded to Business.", "success");
        }
        await onRefresh();
        router.refresh();
        return;
      }
      setMessage(data.error || "Checkout unavailable.");
    } catch {
      setMessage("Upgrade failed. Try again in a moment.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {canBuy && (
          <button
            type="button"
            onClick={() => setModal("add")}
            disabled={loading !== null}
            className="rounded-none border border-rule bg-bg px-3 py-1.5 text-sm font-medium text-ink hover:bg-accent-soft disabled:opacity-60"
          >
            Add +{pack.sitesPerPack} sites
          </button>
        )}
        {canRemove && (
          <button
            type="button"
            onClick={startRemovePack}
            disabled={loading !== null}
            className="rounded-none border border-rule bg-bg px-3 py-1.5 text-sm font-medium text-ink hover:bg-accent-soft disabled:opacity-60"
          >
            Remove {pack.sitesPerPack} sites
          </button>
        )}
      </div>

      <LimitBanners
        plan={plan}
        atLimit={atLimit}
        remaining={remaining}
        canBuy={canBuy}
        interval={interval}
        loading={loading !== null}
        message={message}
        onAdd={() => setModal("add")}
        onUpgrade={() => setModal("upgrade")}
      />

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
        onConfirm={() => confirmRemovePack()}
      />
      <UpgradePlanModal
        open={modal === "upgrade"}
        loading={loading === "business"}
        message={message}
        currentInterval={interval}
        onClose={() => setModal(null)}
        onConfirm={confirmUpgrade}
      />
      <KeepSitesPicker
        open={modal === "remove-keep"}
        title={`Remove ${pack.sitesPerPack} sites`}
        maxKeep={removePreview?.maxKeep ?? siteLimit}
        sites={keepOptions}
        confirmLabel={`Remove ${pack.sitesPerPack} sites`}
        loading={loading === "remove"}
        onClose={() => setModal(null)}
        onConfirm={(ids) => confirmRemovePack(ids)}
        confirmDetail={(_sel, locked) => (
          <>
            <p>Nothing is charged today.</p>
            <p className="mt-2">
              You keep all sites until {removePreview?.renew || "renewal"}. From then,{" "}
              {locked.length} site{locked.length === 1 ? "" : "s"} will be locked if still over the
              new limit. Nothing is deleted. Upgrade anytime to unlock them.
            </p>
            <NoRefundNote keep className="mt-2" />
          </>
        )}
      />
    </>
  );
}
