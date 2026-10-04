"use client";

import Link from "next/link";
import { useState } from "react";
import { ANNUAL_PACK_PRICES, type BillingInterval } from "@/lib/billing-interval";
import { SITE_PACKS } from "@/lib/plans";
import { BillingIntervalToggle } from "@/components/BillingIntervalToggle";
import { PricingCard } from "./PricingCard";
import { customPlanHref, maxSelfServeSites, pricingPlans } from "./pricing-content";

const pack = (id: "pro" | "business", name: string) =>
  `${name} +${SITE_PACKS[id].sitesPerPack} sites for $${SITE_PACKS[id].pricePerMonth}/month or $${ANNUAL_PACK_PRICES[id]}/year`;
const legalLink = "underline underline-offset-4 hover:text-ink";

/** Homepage pricing; /pricing renders it with an h1 (`as`). */
export function PricingSection({ as: Heading = "h2" }: { as?: "h1" | "h2" }) {
  const [interval, setBilling] = useState<BillingInterval>("month");
  return (
    <section id="pricing" className="border-b border-rule bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <Heading className="font-display text-3xl font-medium text-ink sm:text-4xl">Simple pricing</Heading>
            <p className="mt-3 text-muted">
              An online software subscription. Start free with one site, then upgrade monthly or yearly as your portfolio grows.
            </p>
          </div>
          <BillingIntervalToggle value={interval} onChange={setBilling} className="shrink-0 self-start sm:self-auto" />
        </div>

        {Heading === "h1" ? <h2 className="sr-only">Plans</h2> : null}
        <div className="mt-12 grid gap-4 lg:grid-cols-3 lg:gap-y-0">
          {pricingPlans.map((plan) => (
            <PricingCard key={plan.id} plan={plan} interval={interval} />
          ))}
        </div>

        <div className="mt-8 space-y-2 text-sm text-muted">
          <p>
            Prices in USD; applicable taxes may be added at checkout. Optional site packs:{" "}
            {pack("pro", "Pro")}; {pack("business", "Business")}, billed with your plan.
          </p>
          <p>
            Subscriptions renew automatically. Cancel anytime and keep your plan until the end of
            the period you&apos;ve paid for. Payments are non-refundable, apart from the few exceptions
            in our{" "}
            <Link href="/refund-policy" className={legalLink}>
              Refund &amp; Cancellation Policy
            </Link>
            . See also our{" "}
            <Link href="/terms" className={legalLink}>
              Terms of Service
            </Link>
            .
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2 text-sm text-muted sm:flex-row sm:justify-between">
          <p>
            Need more than {maxSelfServeSites} sites?{" "}
            <Link href={customPlanHref} className="font-semibold text-ink underline-offset-2 hover:underline">
              Talk to us
            </Link>{" "}
            about a custom plan.
          </p>
          <p>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-ink underline-offset-2 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
