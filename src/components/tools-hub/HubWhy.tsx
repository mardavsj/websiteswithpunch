import Link from "next/link";
import { FEATURE_LINKS } from "@/content/links";

const REASONS = [
  { n: "01", title: "No signup, nothing to install", body: "Type a domain and get the answer. No account, no browser extension, no command line." },
  { n: "02", title: "Checked from outside your network", body: "Each check runs from our server, so a cached page or a local DNS answer can't hide the real result." },
  { n: "03", title: "Answers you can act on", body: "Days left in green, amber or red, plus a plain-English guide below each tool for fixing what it finds." },
  { n: "04", title: "Safe for everyone", body: "Only public domains are checked: IP addresses, localhost and private networks are refused, every redirect included." },
];

/** Why use the tools, then a soft CTA to have the same checks run daily. */
export function HubWhy() {
  return (
    <>
      <section className="border-b border-rule bg-bg">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-xl">
            <p className="label-caps">Why use them</p>
            <h2 className="mt-4 font-display text-3xl font-medium text-ink sm:text-4xl">
              The quick answer, <span className="text-accent">without</span> the guesswork.
            </h2>
          </div>
          <ul className="mt-14 grid border border-rule sm:grid-cols-2 lg:grid-cols-4">
            {REASONS.map((r) => (
              <li
                key={r.n}
                className="min-w-0 border-rule p-6 [&:not(:first-child)]:border-t sm:[&:nth-child(2)]:border-l sm:[&:nth-child(2)]:border-t-0 sm:[&:nth-child(4)]:border-l lg:[&:not(:first-child)]:border-l lg:[&:not(:first-child)]:border-t-0"
              >
                <p className="font-display text-sm font-medium text-accent">{r.n}</p>
                <h3 className="mt-3 font-display text-lg font-medium text-ink">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{r.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="border-b border-rule bg-bg">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <h2 className="font-display text-3xl font-medium text-ink sm:text-4xl">Monitor it daily for free</h2>
            <p className="mt-4 max-w-lg text-muted">
              The tools answer once. Add a site to Websites With Punch and the same three checks run every day,
              with uptime, SSL days left and domain days left side by side on one dashboard. Free for one site,
              no card needed. We don&apos;t send alerts: the dashboard is where you look.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-hover">
                Start free
              </Link>
              <Link href="/pricing" className="border border-rule bg-surface px-6 py-3 text-sm font-semibold text-ink hover:bg-accent-soft">
                See pricing
              </Link>
            </div>
          </div>
          <ul className="border-t border-rule">
            {FEATURE_LINKS.map((f) => (
              <li key={f.href} className="border-b border-rule">
                <Link href={f.href} className="group flex items-start justify-between gap-4 py-5">
                  <span className="min-w-0">
                    <span className="block font-display text-lg font-medium text-ink group-hover:text-accent">{f.title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted">{f.body}</span>
                  </span>
                  <span aria-hidden className="mt-1 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
