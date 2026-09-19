import Link from "next/link";
import { PLANS } from "@/lib/plans";
import type { ReactNode, SVGProps } from "react";

function IconBase({
  children,
  ...props
}: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

function IconPulse(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M3 12h3.5l2-5 3 10 2.5-6H21" />
    </IconBase>
  );
}

function IconLock(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <rect x="5" y="11" width="14" height="10" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </IconBase>
  );
}

function IconGlobe(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18" />
      <path d="M12 3a14 14 0 0 0 0 18" />
    </IconBase>
  );
}

function IconChart(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 15v-4" />
      <path d="M12 15V8" />
      <path d="M16 15v-7" />
    </IconBase>
  );
}

function IconLink(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M10 13a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0-7.07-7.07L10 5.93" />
      <path d="M14 11a5 5 0 0 0-7.07 0L5.52 12.4a5 5 0 0 0 7.07 7.07L14 18.07" />
    </IconBase>
  );
}

function IconBell(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 7H3s3 0 3-7" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </IconBase>
  );
}

function IconUsers(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19a6 6 0 1 12 0" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15 19a4.5 4.5 0 0 1 6 0" />
    </IconBase>
  );
}

const monitorCards = [
  {
    title: "Uptime",
    body: "We hit your URL on a schedule and record whether it responded. See up/down status, recent history, and response latency so you know when something broke — and how long it took to recover.",
    Icon: IconPulse,
  },
  {
    title: "SSL certificates",
    body: "For HTTPS sites we read the certificate expiry date and show days remaining. Get ahead of browser trust warnings before customers see them and bounce.",
    Icon: IconLock,
  },
  {
    title: "Domain expiry",
    body: "Best-effort RDAP/WHOIS lookups surface when your root domain is due for renewal. A lapsed domain takes the site and often email offline — we help you catch that early.",
    Icon: IconGlobe,
  },
];

const howSteps = [
  {
    step: "01",
    title: "Add your URL",
    body: "Paste the site you care about. Free covers one site; Pro scales to ten.",
    Icon: IconLink,
  },
  {
    step: "02",
    title: "We check it",
    body: "Scheduled HTTP(S) checks, SSL expiry reads, and domain lookups run in the background.",
    Icon: IconPulse,
  },
  {
    step: "03",
    title: "See status & alerts",
    body: "Your dashboard shows up/down, SSL days left, and domain days left — so you act before customers notice.",
    Icon: IconBell,
  },
];

const painPoints = [
  {
    title: "Expired SSL kills trust",
    body: "A red padlock in the browser looks like a scam. Visitors leave. Fixing it after the fact is scramble mode — monitoring days-left is calmer.",
    Icon: IconLock,
  },
  {
    title: "Domain lapse takes everything offline",
    body: "Miss a renewal and the site, email, and DNS can vanish overnight. Domain days-left on the dashboard is cheap insurance.",
    Icon: IconGlobe,
  },
  {
    title: "Downtime loses sales",
    body: "If nobody tells you the shop is down, every minute is lost revenue and support tickets. Uptime history shows what happened and when.",
    Icon: IconChart,
  },
];

const audiences = [
  {
    title: "Founders",
    body: "Ship product, not pager duty. One dashboard for the sites that keep revenue flowing.",
  },
  {
    title: "Freelancers",
    body: "Client sites shouldn’t surprise you. Spot SSL and domain issues before they email you at midnight.",
  },
  {
    title: "Small agencies",
    body: "Monitor a handful of properties without enterprise monitoring pricing. Free for one, Pro for ten.",
  },
];

const faqs = [
  {
    q: "How often do checks run?",
    a: "Uptime checks run on a regular schedule so you see recent status and latency on the dashboard. SSL and domain expiry are refreshed so days-remaining stay useful — not stale.",
  },
  {
    q: "What’s free vs Pro?",
    a: `Free monitors ${PLANS.free.siteLimit} site with uptime, SSL, and domain checks. Pro ($${PLANS.pro.price}/mo) raises the limit to ${PLANS.pro.siteLimit} sites and unlocks Stripe billing management.`,
  },
  {
    q: "Do I need a card to start?",
    a: "No. Create an account, add one URL, and use the free plan. Upgrade to Pro when you need more sites; Stripe checkout comes when you’re ready to pay.",
  },
  {
    q: "How accurate is domain expiry?",
    a: "We use best-effort RDAP/WHOIS lookups. Most common TLDs work well; some registries are sparse or rate-limited. Treat it as an early warning, not a legal registrar notice.",
  },
  {
    q: "Will you spam me with alerts?",
    a: "The goal is signal, not noise: clear status on the dashboard and practical warnings around SSL and domain windows — not a firehose of every transient blip.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Pro is month-to-month. Downgrade or cancel when you don’t need the extra site slots; your free site stays available within Free limits.",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-rule bg-bg">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="label-caps mb-4 inline-flex border border-rule bg-accent-soft px-3 py-1">
              Website health monitoring
            </p>
            <h1 className="font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Monitor uptime, SSL expiry, and domain renewal{" "}
              <span className="text-accent">with punch</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
              Built for freelancers, founders, and small agencies who can’t afford surprise
              downtime — or finding out from a customer that the cert expired.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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
              Free to start · Checks uptime + SSL + domain · Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* What this is */}
      <section className="border-b border-rule bg-bg">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-medium text-ink">What this is</h2>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              websiteswithpunch is a focused website health monitor. You add a URL; we check
              whether it’s up, how many days until the SSL cert expires, and how many days until
              the domain renews — then show it all on one clean dashboard. No enterprise suite.
              No bloated crawler. Just the three things that quietly break live sites.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-b border-rule bg-bg">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-medium text-ink">How it works</h2>
            <p className="mt-3 text-muted">Three steps. Minutes to set up. Ongoing peace of mind.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {howSteps.map((s) => (
              <div key={s.step} className="rounded-none border border-rule bg-bg p-6">
                <div className="flex items-center justify-between">
                  <span className="label-caps text-accent">{s.step}</span>
                  <s.Icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="mt-4 font-display text-lg font-medium text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we monitor */}
      <section id="features" className="border-b border-rule bg-bg">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-medium text-ink">What we monitor</h2>
            <p className="mt-3 text-muted">
              Three checks that cover the failure modes that cost real money and trust.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {monitorCards.map((f) => (
              <div key={f.title} className="rounded-none border border-rule bg-bg p-6">
                <f.Icon className="h-7 w-7 text-accent" />
                <h3 className="mt-4 font-display text-lg font-medium text-ink">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why people pay monthly */}
      <section className="border-b border-rule bg-bg">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-medium text-ink">Why people pay monthly</h2>
            <p className="mt-3 text-muted">
              Because the alternative is finding out the hard way — from users, clients, or a
              blank browser tab.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {painPoints.map((p) => (
              <div key={p.title} className="rounded-none border border-rule bg-accent-soft p-6">
                <p.Icon className="h-7 w-7 text-ink" />
                <h3 className="mt-4 font-display text-lg font-medium text-ink">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="border-b border-rule bg-bg">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-medium text-ink">Dashboard preview</h2>
            <p className="mt-3 text-muted">
              Status, SSL days, and domain days — at a glance. (Static mock of what you’ll see
              after signup.)
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-3xl rounded-none border border-rule bg-bg">
            <div className="flex items-center justify-between border-b border-rule px-5 py-3">
              <span className="font-display text-sm font-medium text-ink">Sites</span>
              <span className="label-caps text-muted">example.com</span>
            </div>
            <div className="grid gap-0 sm:grid-cols-3">
              <div className="border-b border-rule p-5 sm:border-b-0 sm:border-r">
                <p className="label-caps text-muted">Status</p>
                <p className="mt-2 font-display text-2xl font-medium text-ink">
                  <span className="inline-block h-2.5 w-2.5 bg-accent align-middle" />{" "}
                  UP
                </p>
                <p className="mt-1 text-xs text-muted">Last check · 142 ms</p>
              </div>
              <div className="border-b border-rule p-5 sm:border-b-0 sm:border-r">
                <p className="label-caps text-muted">SSL</p>
                <p className="mt-2 font-display text-2xl font-medium text-ink">84 days</p>
                <p className="mt-1 text-xs text-muted">Certificate expires · OK</p>
              </div>
              <div className="p-5">
                <p className="label-caps text-muted">Domain</p>
                <p className="mt-2 font-display text-2xl font-medium text-ink">210 days</p>
                <p className="mt-1 text-xs text-muted">Renewal window · OK</p>
              </div>
            </div>
            <div className="border-t border-rule px-5 py-3 text-xs text-muted">
              One row per site. Free = 1 site · Pro = up to {PLANS.pro.siteLimit}.
            </div>
          </div>
        </div>
      </section>

      {/* Who it’s for */}
      <section className="border-b border-rule bg-bg">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-medium text-ink">Who it’s for</h2>
            <p className="mt-3 text-muted">People who own sites but don’t want a full ops stack.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {audiences.map((a) => (
              <div key={a.title} className="rounded-none border border-rule p-6">
                <IconUsers className="h-6 w-6 text-accent" />
                <h3 className="mt-3 font-display text-lg font-medium text-ink">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-b border-rule bg-bg">
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
                <li>· 1 monitored site</li>
                <li>· Uptime + SSL + domain checks</li>
                <li>· Dashboard & history</li>
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
                <li>· Up to 10 monitored sites</li>
                <li>· Stripe billing portal</li>
                <li>· Same powerful checks</li>
              </ul>
              <Link
                href="/signup"
                className="mt-8 block rounded-none bg-accent py-2.5 text-center text-sm font-semibold text-white hover:bg-accent-hover"
              >
                Upgrade after signup
              </Link>
            </div>
          </div>
          <p className="mt-8 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-ink underline-offset-2 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-rule bg-bg">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <div className="text-center">
            <h2 className="font-display text-3xl font-medium text-ink">FAQ</h2>
            <p className="mt-3 text-muted">Straight answers before you sign up.</p>
          </div>
          <dl className="mt-12 space-y-6">
            {faqs.map((item) => (
              <div key={item.q} className="rounded-none border border-rule p-5">
                <dt className="font-display text-base font-medium text-ink">{item.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <h2 className="font-display text-3xl font-medium text-ink">Ready to punch downtime?</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          Create a free account, add your first URL, and see status, SSL days, and domain days in
          one dashboard.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex rounded-none bg-ink px-6 py-3 text-sm font-semibold text-bg hover:opacity-90"
          >
            Create free account
          </Link>
          <Link
            href="/#pricing"
            className="inline-flex rounded-none border border-rule bg-bg px-6 py-3 text-sm font-semibold text-ink hover:bg-accent-soft"
          >
            Compare plans
          </Link>
        </div>
      </section>
    </div>
  );
}
