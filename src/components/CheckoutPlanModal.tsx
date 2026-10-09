"use client";

import { useEffect, useState } from "react";
import { BillingIntervalToggle } from "@/components/BillingIntervalToggle";
import {
  ModalShell,
  NoRefundNote,
  primaryBtn,
  secondaryBtn,
  useEscapeClose,
} from "@/components/billing/modal-bits";
import { PLANS } from "@/lib/plans";
import { TAX_NOTE_CHECKOUT } from "@/lib/tax-copy";
import {
  ANNUAL_PRICES,
  formatPlanPrice,
  perMonthPrice,
  periodWord,
  type BillingInterval,
} from "@/lib/billing-interval";

type Props = {
  /** Plan being bought (new subscription → Dodo Payments checkout); null = closed. */
  planId: "pro" | "business" | null;
  loading: boolean;
  message: string | null;
  onClose: () => void;
  onConfirm: (interval: BillingInterval) => void;
};

/** Free → Pro / Business: pick Monthly or Annual, then continue to Dodo Payments checkout. */
export function CheckoutPlanModal({ planId, loading, message, onClose, onConfirm }: Props) {
  const [interval, setBilling] = useState<BillingInterval>("month");
  const open = planId !== null;

  useEffect(() => {
    if (open) setBilling("month");
  }, [open]);

  useEscapeClose(open, onClose);
  if (!planId) return null;

  const plan = PLANS[planId];
  const yearly = interval === "year";

  return (
    <ModalShell titleId="checkout-plan-title" onClose={onClose}>
      <h2 id="checkout-plan-title" className="font-display text-xl font-medium text-ink">
        Upgrade to {plan.name}
      </h2>
      <BillingIntervalToggle
        value={interval}
        onChange={setBilling}
        disabled={loading}
        className="mt-4"
      />

      <div className="mt-4 space-y-3">
        <p className="font-display text-2xl font-medium text-ink">
          {formatPlanPrice(planId, interval)}
        </p>
        <p className="text-sm leading-relaxed text-muted">
          {yearly
            ? `One payment a year, which works out to $${perMonthPrice(planId, "year")} a month. That's 2 months free compared with paying monthly ($${plan.price * 12} a year).`
            : `One payment a month. Choose Annual to get 2 months free ($${ANNUAL_PRICES[planId]} a year).`}
        </p>
        <p className="text-sm leading-relaxed text-muted">
          Up to {plan.siteLimit} sites. Cancel anytime and you keep {plan.name} until the end of
          the {periodWord(interval)} you&apos;ve paid for.
        </p>
        <p className="text-xs text-muted">
          Next you&apos;ll pay on the secure Dodo Payments checkout (our merchant of record). Nothing
          is charged until you confirm there. {TAX_NOTE_CHECKOUT}
        </p>
        <NoRefundNote />
      </div>

      {message && <p className="mt-3 text-sm text-danger">{message}</p>}
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onConfirm(interval)}
          disabled={loading}
          className={primaryBtn}
        >
          {loading ? "Redirecting…" : "Continue to payment"}
        </button>
        <button type="button" onClick={onClose} disabled={loading} className={secondaryBtn}>
          Cancel
        </button>
      </div>
    </ModalShell>
  );
}
