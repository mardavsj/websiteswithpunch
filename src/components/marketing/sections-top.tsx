import Link from "next/link";
import { DashboardMock } from "./DashboardMock";
import { howSteps, proofMetrics } from "./home-content";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-rule bg-bg">
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-[30%] bg-accent-soft max-lg:hidden"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-8 top-0 h-full w-px rotate-12 bg-rule max-lg:hidden"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[7fr_3fr] lg:gap-10">
          <div>
            <h1 className="font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
              Monitor uptime, SSL, and domain renewal{" "}
              <span className="text-accent">with punch</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted">
              For freelancers, founders, and small agencies who can’t afford surprise downtime —
              or finding out from a customer that the cert expired.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="rounded-none bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-hover"
              >
                Start free — 1 site
              </Link>
              <Link
                href="/#how-it-works"
                className="rounded-none border border-rule bg-bg px-6 py-3 text-sm font-semibold text-ink hover:bg-accent-soft"
              >
                See how it works
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted">
              Free to start · Uptime + SSL + domain · Cancel anytime
            </p>
          </div>
          <div className="relative lg:pl-2">
            <div className="absolute -inset-4 -z-10 bg-accent-soft lg:hidden" aria-hidden />
            <DashboardMock dense />
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProofStrip() {
  return (
    <section className="bg-ink text-bg" aria-label="What we cover">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px sm:grid-cols-4">
        {proofMetrics.map((m, i) => (
          <div
            key={m.label}
            className={`px-4 py-8 sm:px-6 sm:py-10 ${i > 0 ? "border-l border-bg/15" : ""} ${i >= 2 ? "border-t border-bg/15 sm:border-t-0" : ""}`}
          >
            <p className="font-display text-lg font-medium sm:text-xl">{m.label}</p>
            <p className="mt-1 text-sm text-bg/65">{m.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function IntroLine() {
  return (
    <section className="border-b border-rule bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <p className="max-w-3xl font-display text-2xl font-medium leading-snug text-ink sm:text-3xl">
          A focused website health monitor. Add a URL — we check whether it’s up, SSL days left,
          and domain days left. No enterprise suite. Just the three things that quietly break live
          sites.
        </p>
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-b border-rule bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-xl">
          <h2 className="font-display text-3xl font-medium text-ink sm:text-4xl">How it works</h2>
          <p className="mt-3 text-muted">Three steps. Minutes to set up. Ongoing peace of mind.</p>
        </div>
        <div className="relative mt-14">
          <div
            className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-rule md:block"
            aria-hidden
          />
          <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
            {howSteps.map((s) => (
              <li key={s.step} className="relative">
                <div className="flex items-baseline gap-3 md:flex-col md:gap-0">
                  <span className="relative z-10 bg-bg pr-3 font-display text-4xl font-medium text-accent md:text-5xl">
                    {s.step}
                  </span>
                  <div className="md:mt-6">
                    <div className="flex items-center gap-2">
                      <s.Icon className="h-5 w-5 text-ink" />
                      <h3 className="font-display text-lg font-medium text-ink">{s.title}</h3>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
