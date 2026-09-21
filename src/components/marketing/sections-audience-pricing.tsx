import Link from "next/link";
import { PLANS } from "@/lib/plans";
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

export function PricingSection() {
  return (
    <section id="pricing" className="border-b border-rule bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-xl">
          <h2 className="font-display text-3xl font-medium text-ink sm:text-4xl">Simple pricing</h2>
          <p className="mt-3 text-muted">Start free. Upgrade when you need more sites.</p>
        </div>
        <div className="mx-auto mt-12 grid max-w-5xl gap-8 lg:grid-cols-[1fr_1.15fr] lg:items-stretch">
          <div className="flex flex-col border border-rule p-8 sm:p-10">
            <p className="label-caps">Starter</p>
            <h3 className="mt-2 font-display text-2xl font-medium text-ink">{PLANS.free.name}</h3>
            <p className="mt-4 font-display text-5xl font-medium text-ink">
              $0<span className="text-lg font-normal text-muted">/mo</span>
            </p>
            <p className="mt-3 text-sm text-muted">{PLANS.free.description}</p>
            <ul className="mt-8 space-y-3 border-t border-rule pt-8 text-sm text-ink">
              <li className="flex gap-3">
                <span className="text-accent" aria-hidden>
                  —
                </span>
                1 monitored site
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
                Dashboard &amp; history
              </li>
            </ul>
            <Link
              href="/signup"
              className="mt-auto inline-flex w-fit pt-8 text-sm font-semibold text-ink underline-offset-4 hover:underline"
            >
              Get started free →
            </Link>
          </div>
          <div className="relative flex flex-col bg-ink p-8 text-bg sm:p-10">
            <span className="absolute right-6 top-0 -translate-y-1/2 bg-accent px-3 py-1 text-xs font-semibold text-white">
              Popular
            </span>
            <p className="label-caps !text-bg/55">Grow</p>
            <h3 className="mt-2 font-display text-2xl font-medium">{PLANS.pro.name}</h3>
            <p className="mt-4 font-display text-5xl font-medium">
              ${PLANS.pro.price}
              <span className="text-lg font-normal text-bg/55">/mo</span>
            </p>
            <p className="mt-3 text-sm text-bg/70">{PLANS.pro.description}</p>
            <ul className="mt-8 space-y-3 border-t border-bg/15 pt-8 text-sm">
              <li className="flex gap-3">
                <span className="text-accent" aria-hidden>
                  —
                </span>
                Up to {PLANS.pro.siteLimit} monitored sites
              </li>
              <li className="flex gap-3">
                <span className="text-accent" aria-hidden>
                  —
                </span>
                Billing portal included
              </li>
              <li className="flex gap-3">
                <span className="text-accent" aria-hidden>
                  —
                </span>
                Same powerful checks
              </li>
            </ul>
            <Link
              href="/signup"
              className="mt-10 block bg-accent py-3 text-center text-sm font-semibold text-white hover:bg-accent-hover"
            >
              Upgrade after signup
            </Link>
          </div>
        </div>
        <p className="mt-10 text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-ink underline-offset-2 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </section>
  );
}
