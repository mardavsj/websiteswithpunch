import Link from "next/link";
import { PLANS, SITE_PACKS } from "@/lib/plans";
import { audiences } from "./home-content";

export function AudienceSection() {
  return (
    <section className="border-b border-rule bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-xl">
          <h2 className="font-display text-3xl font-medium text-ink sm:text-4xl">Who it’s for</h2>
          <p className="mt-3 text-muted">People who own sites but don’t want a full ops stack.</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 md:grid-rows-2">
          {audiences.map((a) =>
            a.wide ? (
              <div
                key={a.title}
                className="border border-rule bg-accent-soft p-8 md:row-span-2 md:flex md:flex-col md:justify-center md:p-10"
              >
                <p className="label-caps text-accent">Primary</p>
                <h3 className="mt-3 font-display text-3xl font-medium text-ink sm:text-4xl">
                  {a.title}
                </h3>
                <p className="mt-4 max-w-sm text-base leading-relaxed text-muted">{a.body}</p>
              </div>
            ) : (
              <div key={a.title} className="border border-rule p-6 sm:p-8">
                <h3 className="font-display text-xl font-medium text-ink">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{a.body}</p>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

const PRICING_ORDER = [PLANS.free, PLANS.pro, PLANS.business] as const;

function signupHref(planId: "free" | "pro" | "business"): string {
  if (planId === "pro") return "/signup?plan=pro";
  if (planId === "business") return "/signup?plan=business";
  return "/signup";
}

export function PricingSection() {
  return (
    <section id="pricing" className="border-b border-rule bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-xl">
          <h2 className="font-display text-3xl font-medium text-ink sm:text-4xl">Simple pricing</h2>
          <p className="mt-3 text-muted">
            Three plans. Need a few more sites? Add packs from the dashboard — no confusing
            per-site pricing.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:items-stretch">
          {PRICING_ORDER.map((plan) => {
            const featured = plan.id === "pro";
            const sitesLabel =
              plan.siteLimit === 1
                ? "1 monitored site"
                : `Up to ${plan.siteLimit} monitored sites`;

            return (
              <div
                key={plan.id}
                className={`relative flex h-full min-w-0 flex-col p-8 sm:p-9 ${
                  featured ? "bg-ink text-bg" : "border border-rule bg-bg text-ink"
                }`}
              >
                {featured && (
                  <span className="absolute right-6 top-0 -translate-y-1/2 bg-accent px-3 py-1 text-xs font-semibold text-white">
                    Popular
                  </span>
                )}
                <p className={`label-caps ${featured ? "!text-bg/55" : ""}`}>
                  {plan.id === "free" ? "Starter" : plan.id === "pro" ? "Grow" : "Scale"}
                </p>
                <h3 className="mt-2 font-display text-2xl font-medium">{plan.name}</h3>
                <p className="mt-4 font-display text-5xl font-medium">
                  ${plan.price}
                  <span
                    className={`text-lg font-normal ${featured ? "text-bg/55" : "text-muted"}`}
                  >
                    /mo
                  </span>
                </p>
                <p className={`mt-3 text-sm ${featured ? "text-bg/70" : "text-muted"}`}>
                  {plan.description}
                </p>
                <ul
                  className={`mt-8 space-y-3 border-t pt-8 text-sm ${
                    featured ? "border-bg/15" : "border-rule"
                  }`}
                >
                  <li className="flex gap-3">
                    <span className="text-accent" aria-hidden>
                      —
                    </span>
                    {sitesLabel}
                  </li>
                  <li className="flex gap-3">
                    <span className="text-accent" aria-hidden>
                      —
                    </span>
                    Uptime + SSL + domain checks
                  </li>
                  <li className="flex gap-3">
                    <span className="text-accent" aria-hidden>
                      —
                    </span>
                    Dashboard & history
                  </li>
                  {plan.id !== "free" && (
                    <li className="flex gap-3">
                      <span className="text-accent" aria-hidden>
                        —
                      </span>
                      Billing portal included
                    </li>
                  )}
                  {plan.id === "pro" && (
                    <li className="flex gap-3">
                      <span className="text-accent" aria-hidden>
                        —
                      </span>
                      Optional +{SITE_PACKS.pro.sitesPerPack} site packs ($
                      {SITE_PACKS.pro.pricePerMonth}/mo)
                    </li>
                  )}
                  {plan.id === "business" && (
                    <li className="flex gap-3">
                      <span className="text-accent" aria-hidden>
                        —
                      </span>
                      Optional +{SITE_PACKS.business.sitesPerPack} site packs ($
                      {SITE_PACKS.business.pricePerMonth}/mo)
                    </li>
                  )}
                </ul>
                <Link
                  href={signupHref(plan.id)}
                  className={
                    featured
                      ? "mt-auto block bg-accent py-3 text-center text-sm font-semibold text-white hover:bg-accent-hover"
                      : "mt-auto inline-flex w-fit pt-8 text-sm font-semibold text-ink underline-offset-4 hover:underline"
                  }
                >
                  {plan.id === "free"
                    ? "Get started free →"
                    : plan.id === "pro"
                      ? "Start with Pro"
                      : "Start with Business"}
                </Link>
              </div>
            );
          })}
        </div>

        <div className="mt-10 space-y-2 text-sm text-muted">
          <p>
            Pro packs add +{SITE_PACKS.pro.sitesPerPack} sites for $
            {SITE_PACKS.pro.pricePerMonth}/mo (up to{" "}
            {PLANS.pro.siteLimit + SITE_PACKS.pro.maxPacks * SITE_PACKS.pro.sitesPerPack} sites).
            Business packs add +{SITE_PACKS.business.sitesPerPack} for $
            {SITE_PACKS.business.pricePerMonth}/mo (up to{" "}
            {PLANS.business.siteLimit +
              SITE_PACKS.business.maxPacks * SITE_PACKS.business.sitesPerPack}{" "}
            sites). Need more?{" "}
            <a
              href="mailto:hello@websiteswithpunch.com?subject=Custom%20site%20limit"
              className="font-semibold text-ink underline-offset-2 hover:underline"
            >
              Contact us
            </a>
            .
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
