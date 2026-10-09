"use client";

import Link from "next/link";
import type { PlanId } from "@/lib/plans";
import { PLANS } from "@/lib/plans";
import { formatPlanPrice, perMonthPrice, type BillingInterval } from "@/lib/billing-interval";
import { BillingIntervalToggle } from "@/components/BillingIntervalToggle";
import { AuthHeading, AuthNotice } from "@/components/auth/AuthShell";

/** Title, plan/billing summary (unchanged copy) and the annual toggle for paid signups. */
export function SignupHeader({
  planId,
  interval,
  onInterval,
  loading,
  canceled,
}: {
  planId: PlanId;
  interval: BillingInterval;
  onInterval: (v: BillingInterval) => void;
  loading: boolean;
  canceled: boolean;
}) {
  const isPaid = planId === "pro" || planId === "business";
  const plan = PLANS[planId];
  const paidId = planId === "business" ? "business" : "pro";
  const priceLabel = formatPlanPrice(paidId, interval);
  const subtitle = isPaid
    ? interval === "year"
      ? `You'll pay ${priceLabel} ($${perMonthPrice(paidId, "year")}/mo, 2 months free) for up to ${plan.siteLimit} sites, plus applicable tax shown at checkout. You'll verify your email, then pay securely on Dodo Payments.`
      : `You'll pay ${priceLabel} for up to ${plan.siteLimit} sites, plus applicable tax shown at checkout. You'll verify your email, then pay securely on Dodo Payments.`
    : "Free plan includes 1 monitored site. Upgrade anytime for more sites.";

  return (
    <>
      <AuthHeading title={isPaid ? `Start ${plan.name}` : "Create your account"} />
      {isPaid && (
        <BillingIntervalToggle
          value={interval}
          onChange={onInterval}
          disabled={loading}
          className="mt-4 self-start"
        />
      )}
      <p className={`${isPaid ? "mt-3" : "mt-2"} text-sm leading-relaxed text-muted`}>{subtitle}</p>
      {canceled && (
        <AuthNotice tone="warning" className="mt-3">
          Checkout was canceled. You can try again when you&apos;re ready — no account was created.
        </AuthNotice>
      )}
    </>
  );
}

export function paidButtonLabel(planId: PlanId, interval: BillingInterval) {
  const paidId = planId === "business" ? "business" : "pro";
  return `Continue to payment — ${formatPlanPrice(paidId, interval)}`;
}

const legal = "underline underline-offset-2 hover:text-ink";

/** Agreement line under the button; links open in a new tab so typed details aren't lost. */
export function SignupConsent({ paid }: { paid: boolean }) {
  return (
    <p className="text-center text-xs text-muted">
      By creating an account you agree to our{" "}
      <Link href="/terms" target="_blank" rel="noopener" className={legal}>Terms</Link> and{" "}
      <Link href="/privacy" target="_blank" rel="noopener" className={legal}>Privacy Policy</Link>.
      {paid ? (
        <>
          {" "}Payments are non-refundable; see our{" "}
          <Link href="/refund-policy" target="_blank" rel="noopener" className={legal}>
            Refund &amp; Cancellation Policy
          </Link>
          .
        </>
      ) : null}
    </p>
  );
}
