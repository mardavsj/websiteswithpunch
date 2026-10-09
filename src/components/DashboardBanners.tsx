"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DashboardBanners({
  showDefaultLockNotice,
  paymentFailed,
  onHold = false,
  siteLimit,
  activeCount,
}: {
  showDefaultLockNotice: boolean;
  paymentFailed: boolean;
  /** Dodo on_hold: the renewal failed and the paid plan is paused until the card is updated. */
  onHold?: boolean;
  siteLimit: number;
  activeCount: number;
}) {
  const router = useRouter();
  const [hiding, setHiding] = useState(false);

  async function dismiss() {
    setHiding(true);
    await fetch("/api/sites/dismiss-lock-notice", { method: "POST" });
    router.refresh();
  }

  async function openPortal() {
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  return (
    <div className="mt-6 space-y-3">
      {paymentFailed && (
        <div className="rounded-none border border-amber-300 bg-amber-50 dark:border-amber-400/30 dark:bg-amber-400/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
          {onHold
            ? "Your last renewal payment didn't go through, so your paid plan is on hold."
            : "We couldn't take your last payment."}{" "}
          <button
            type="button"
            onClick={openPortal}
            className="font-semibold underline underline-offset-2"
          >
            Update your payment method
          </button>{" "}
          {onHold ? "to restore it." : "to keep your plan."}
        </div>
      )}
      {showDefaultLockNotice && (
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-none border border-amber-300 bg-amber-50 dark:border-amber-400/30 dark:bg-amber-400/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
          <p>
            Your plan now includes {siteLimit} site{siteLimit === 1 ? "" : "s"}. We kept your oldest
            site{activeCount === 1 ? "" : "s"} active. Upgrade anytime to unlock the rest.
          </p>
          <button
            type="button"
            disabled={hiding}
            onClick={dismiss}
            className="rounded-none border border-amber-300 bg-surface px-2 py-0.5 text-xs font-medium"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
