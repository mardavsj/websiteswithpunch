import Link from "next/link";
import { PLANS } from "@/lib/plans";

const features = [
  {
    title: "Uptime monitoring",
    body: "HTTP(S) checks that mark your sites up or down, store history, and surface latency.",
    icon: "[time]",
  },
  {
    title: "SSL expiry alerts",
    body: "Fetch certificate expiry for HTTPS URLs and warn before visitors hit scary browser warnings.",
    icon: "[lock]",
  },
  {
    title: "Domain expiry",
    body: "Best-effort RDAP/WHOIS lookups so you never let a root domain silently expire.",
    icon: "[web]",
  },
  {
    title: "Clean dashboard",
    body: "One place for status, last check, SSL days left, and domain days left across your sites.",
    icon: "[chart]",
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-rule bg-bg">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="label-caps mb-4 inline-flex border border-rule bg-accent-soft px-3 py-1">
              websiteswithpunch.com
            </p>
            <h1 className="font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Website health monitoring{" "}
              <span className="text-accent">with punch</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
              Know when your site goes down, when SSL is about to expire, and when your domain
              renewal is coming up - before customers notice.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/signup"
                className="rounded-none bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-hover"
              >
                Start free - 1 site
              </Link>
              <Link
                href="/#pricing"
                className="rounded-none border border-rule bg-bg px-6 py-3 text-sm font-semibold text-ink hover:bg-accent-soft"
              >
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-medium text-ink">Everything you need for MVP monitoring</h2>
          <p className="mt-3 text-muted">
            Focused checks. No bloated crawlers. Built for founders who ship.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-none border border-rule bg-bg p-6"
            >
              <div className="text-2xl">{f.icon}</div>
              <h3 className="mt-3 font-display text-lg font-medium text-ink">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="border-y border-rule bg-bg">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-medium text-ink">Simple pricing</h2>
            <p className="mt-3 text-muted">Start free. Upgrade when you need more sites.</p>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
            <div className="rounded-none border border-rule p-8">
              <h3 className="font-display text-xl font-medium">{PLANS.free.name}</h3>
              <p className="mt-2 font-display text-4xl font-medium text-ink">
                $0<span className="text-base font-normal text-muted">/mo</span>
              </p>
              <p className="mt-3 text-sm text-muted">{PLANS.free.description}</p>
              <ul className="mt-6 space-y-2 text-sm text-ink">
                <li>* 1 monitored site</li>
                <li>* Uptime + SSL + domain checks</li>
                <li>* Dashboard & history</li>
              </ul>
              <Link
                href="/signup"
                className="mt-8 block rounded-none border border-rule py-2.5 text-center text-sm font-semibold text-ink hover:bg-accent-soft"
              >
                Get started
              </Link>
            </div>
            <div className="relative rounded-none border-2 border-accent bg-accent-soft p-8">
              <span className="absolute -top-3 right-6 rounded-none bg-accent px-3 py-0.5 text-xs font-semibold text-white">
                Popular
              </span>
              <h3 className="font-display text-xl font-medium">{PLANS.pro.name}</h3>
              <p className="mt-2 font-display text-4xl font-medium text-ink">
                ${PLANS.pro.price}
                <span className="text-base font-normal text-muted">/mo</span>
              </p>
              <p className="mt-3 text-sm text-muted">{PLANS.pro.description}</p>
              <ul className="mt-6 space-y-2 text-sm text-ink">
                <li>* Up to 10 monitored sites</li>
                <li>* Stripe billing portal</li>
                <li>* Same powerful checks</li>
              </ul>
              <Link
                href="/signup"
                className="mt-8 block rounded-none bg-accent py-2.5 text-center text-sm font-semibold text-white hover:bg-accent-hover"
              >
                Upgrade after signup
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <h2 className="font-display text-3xl font-medium text-ink">Ready to punch downtime?</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          Create a free account, add your first URL, and see status, SSL days, and domain days in
          one dashboard.
        </p>
        <Link
          href="/signup"
          className="mt-8 inline-flex rounded-none bg-ink px-6 py-3 text-sm font-semibold text-bg hover:opacity-90"
        >
          Create free account
        </Link>
      </section>
    </div>
  );
}
