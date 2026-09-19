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
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-indigo-50 via-white to-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
              websiteswithpunch.com
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Website health monitoring{" "}
              <span className="text-indigo-600">with punch</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600">
              Know when your site goes down, when SSL is about to expire, and when your domain
              renewal is coming up - before customers notice.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/signup"
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500"
              >
                Start free - 1 site
              </Link>
              <Link
                href="/#pricing"
                className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-slate-900">Everything you need for MVP monitoring</h2>
          <p className="mt-3 text-slate-600">
            Focused checks. No bloated crawlers. Built for founders who ship.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="text-2xl">{f.icon}</div>
              <h3 className="mt-3 text-lg font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900">Simple pricing</h2>
            <p className="mt-3 text-slate-600">Start free. Upgrade when you need more sites.</p>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-8">
              <h3 className="text-xl font-semibold">{PLANS.free.name}</h3>
              <p className="mt-2 text-4xl font-bold">
                $0<span className="text-base font-normal text-slate-500">/mo</span>
              </p>
              <p className="mt-3 text-sm text-slate-600">{PLANS.free.description}</p>
              <ul className="mt-6 space-y-2 text-sm text-slate-700">
                <li>* 1 monitored site</li>
                <li>* Uptime + SSL + domain checks</li>
                <li>* Dashboard & history</li>
              </ul>
              <Link
                href="/signup"
                className="mt-8 block rounded-xl border border-slate-300 py-2.5 text-center text-sm font-semibold hover:bg-slate-50"
              >
                Get started
              </Link>
            </div>
            <div className="relative rounded-2xl border-2 border-indigo-600 bg-indigo-50/40 p-8 shadow-lg">
              <span className="absolute -top-3 right-6 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white">
                Popular
              </span>
              <h3 className="text-xl font-semibold">{PLANS.pro.name}</h3>
              <p className="mt-2 text-4xl font-bold">
                ${PLANS.pro.price}
                <span className="text-base font-normal text-slate-500">/mo</span>
              </p>
              <p className="mt-3 text-sm text-slate-600">{PLANS.pro.description}</p>
              <ul className="mt-6 space-y-2 text-sm text-slate-700">
                <li>* Up to 10 monitored sites</li>
                <li>* Stripe billing portal</li>
                <li>* Same powerful checks</li>
              </ul>
              <Link
                href="/signup"
                className="mt-8 block rounded-xl bg-indigo-600 py-2.5 text-center text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Upgrade after signup
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-3xl font-bold text-slate-900">Ready to punch downtime?</h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">
          Create a free account, add your first URL, and see status, SSL days, and domain days in
          one dashboard.
        </p>
        <Link
          href="/signup"
          className="mt-8 inline-flex rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Create free account
        </Link>
      </section>
    </div>
  );
}
