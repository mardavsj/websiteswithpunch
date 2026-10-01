"use client";

import Link from "next/link";
import { useState } from "react";
import type { BillingInterval } from "@/lib/billing-interval";
import { BillingIntervalToggle } from "@/components/BillingIntervalToggle";
import { PricingCard } from "./PricingCard";
import { customPlanHref, maxSelfServeSites, pricingPlans } from "./pricing-content";

export function PricingSection() {
  const [interval, setBilling] = useState<BillingInterval>("month");
  return (
    <section id="pricing" className="border-b border-rule bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-medium text-ink sm:text-4xl">Simple pricing</h2>
            <p className="mt-3 text-muted">
              Start free with one site. Upgrade as your portfolio grows, monthly or yearly.
            </p>
          </div>
          <BillingIntervalToggle value={interval} onChange={setBilling} className="shrink-0 self-start sm:self-auto" />
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3 lg:gap-y-0">
          {pricingPlans.map((plan) => (
            <PricingCard key={plan.id} plan={plan} interval={interval} />
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-2 text-sm text-muted sm:flex-row sm:justify-between">
          <p>
            Need more than {maxSelfServeSites} sites?{" "}
            <a href={customPlanHref} className="font-semibold text-ink underline-offset-2 hover:underline">
              Talk to us
            </a>{" "}
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
