import Link from "next/link";
import { Check, PricingCard } from "./PricingCard";
import { customPlanHref, everyPlanIncludes, maxSelfServeSites, pricingPlans } from "./pricing-content";

export function PricingSection() {
  return (
    <section id="pricing" className="border-b border-rule bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-medium text-ink sm:text-4xl">Simple pricing</h2>
            <p className="mt-3 text-muted">
              Start free with one site. Upgrade as your portfolio grows, month to month.
            </p>
          </div>
          <p className="label-caps">Monthly billing · Cancel anytime</p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </div>

        <div className="mt-4 border border-rule bg-surface px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-4">
            <p className="label-caps">Every plan includes</p>
            <ul className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm text-ink min-[420px]:grid-cols-2 sm:grid-cols-3 lg:flex lg:justify-between">
              {everyPlanIncludes.map((f) => (
                <li key={f} className="flex items-center gap-2 lg:whitespace-nowrap">
                  <Check className="text-accent" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
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
