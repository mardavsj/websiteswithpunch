"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DashboardBanners({
  showDefaultLockNotice,
  paymentFailed,
  siteLimit,
  activeCount,
}: {
  showDefaultLockNotice: boolean;
  paymentFailed: boolean;
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
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  return (
    <div className="mt-6 space-y-3">
      {paymentFailed && (
        <div className="rounded-none border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          We couldn&apos;t take your last payment.{" "}
          <button
            type="button"
            onClick={openPortal}
            className="font-semibold underline underline-offset-2"
          >
            Update your card
          </button>{" "}
          to keep your plan.
        </div>
      )}
      {showDefaultLockNotice && (
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-none border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p>
            Your plan now includes {siteLimit} site{siteLimit === 1 ? "" : "s"}. We kept your oldest
            site{activeCount === 1 ? "" : "s"} active. Choose different ones anytime.
          </p>
          <button
            type="button"
            disabled={hiding}
            onClick={dismiss}
            className="rounded-none border border-amber-300 bg-white px-2 py-0.5 text-xs font-medium"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
