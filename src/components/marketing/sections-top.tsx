import Link from "next/link";
import { howSteps, proofMetrics } from "./home-content";

/** Mixkit Free License — Digital network representation (related to uptime/network monitoring). */
const HERO_VIDEO =
  "https://assets.mixkit.co/videos/31590/31590-720.mp4";
const HERO_POSTER =
  "https://assets.mixkit.co/videos/31590/31590-thumb-720-0.jpg";

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden border-b border-rule bg-ink text-bg">
      {/* Live stock background — network visualization from Mixkit */}
      <div className="absolute inset-0 -z-10" aria-hidden>
        <video
          className="h-full w-full object-cover opacity-55 motion-reduce:hidden"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={HERO_POSTER}
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
        {/* Static fallback when reduced motion is preferred */}
        <div
          className="absolute inset-0 hidden bg-cover bg-center motion-reduce:block"
          style={{ backgroundImage: `url(${HERO_POSTER})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-transparent to-ink/40" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-32">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-none border border-bg/20 bg-bg/10 px-3 py-1.5 text-xs font-medium text-bg/90 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            Live network pulse · uptime + SSL + domain
          </p>

          <h1 className="mt-6 font-display text-4xl font-medium tracking-tight text-bg sm:text-5xl lg:text-[3.35rem] lg:leading-[1.08]">
            Monitor uptime, SSL, and domain renewal{" "}
            <span className="text-accent">with punch</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-bg/70">
            For freelancers, founders, and small agencies who can’t afford surprise downtime — or
            finding out from a customer that the cert expired.
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
              className="rounded-none border border-bg/25 bg-bg/10 px-6 py-3 text-sm font-semibold text-bg backdrop-blur-sm hover:bg-bg/20"
            >
              See how it works
            </Link>
          </div>
          <p className="mt-6 text-sm text-bg/55">
            Free to start · Uptime + SSL + domain · Cancel anytime
          </p>
        </div>

        <dl className="mt-14 grid max-w-2xl grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: "Uptime", value: "Live" },
            { label: "SSL", value: "Days left" },
            { label: "Domain", value: "Renewal" },
          ].map((item) => (
            <div
              key={item.label}
              className="border border-bg/15 bg-bg/10 px-3 py-4 backdrop-blur-sm sm:px-4"
            >
              <dt className="text-[10px] font-medium uppercase tracking-wider text-bg/50">
                {item.label}
              </dt>
              <dd className="mt-1 font-display text-base font-medium text-bg sm:text-lg">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
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
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
          <p className="max-w-3xl font-display text-2xl font-medium leading-snug text-ink sm:text-3xl">
            A focused website health monitor. Add a URL — we check whether it’s up, SSL days left,
            and domain days left. No enterprise suite. Just the three things that quietly break live
            sites.
          </p>
          <div className="flex justify-center lg:justify-end">
            <img
              src="https://www.websiteswithpunch.com/logo.png"
              alt="Websites With Punch"
              className="h-28 w-28 object-contain sm:h-36 sm:w-36 lg:h-44 lg:w-44"
            />
          </div>
        </div>
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
