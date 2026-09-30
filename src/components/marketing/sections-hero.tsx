import Link from "next/link";
import { HeroDots } from "./HeroDots";
import { HeroStage } from "./HeroStage";
import { IconGlobe, IconLock, IconPulse } from "./icons";

/** Neutral "what we check" row: protocols we really use, not customer logos. */
const checks = [
  { tag: "HTTP(S)", label: "Uptime & latency", Icon: IconPulse },
  { tag: "TLS", label: "Certificate expiry", Icon: IconLock },
  { tag: "RDAP / WHOIS", label: "Domain expiry", Icon: IconGlobe },
];

function Before() {
  return (
    <span className="relative inline-block text-accent">
      before
      <svg viewBox="0 0 200 12" className="absolute -bottom-2 left-0 w-full overflow-visible" aria-hidden>
        <path
          d="M4 9C52 3 132 1.5 196 6.5"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1"
          className="stroke-accent/60 motion-safe:animate-[hero-draw_0.9s_0.3s_cubic-bezier(0.33,1,0.68,1)_both]"
        />
      </svg>
    </span>
  );
}

export function HeroSection() {
  // lg+: fill the viewport below the 65px sticky navbar, capped so tall screens don't balloon.
  return (
    <section className="relative isolate overflow-hidden border-b border-rule bg-bg lg:flex lg:min-h-[min(calc(100svh_-_65px),1024px)] lg:items-center">
      <HeroDots />
      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1.38fr)_minmax(0,1fr)] lg:gap-10 lg:py-16">
        <div className="min-w-0">
          <Link
            href="/#how-it-works"
            className="group inline-flex items-center gap-2 border border-rule bg-surface py-1 pl-1 pr-3 text-xs text-ink shadow-[3px_3px_0_0_hsl(var(--accent)/0.18)] hover:bg-accent-soft"
          >
            <span className="bg-accent px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
              New
            </span>
            Live auto-refresh analytics
            <span aria-hidden className="text-muted transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none">
              →
            </span>
          </Link>

          <h1 className="mt-6 max-w-[17ch] font-display text-[2.3rem] font-medium leading-[1.04] tracking-[-0.035em] text-ink sm:text-[3.25rem] lg:max-w-none lg:text-[2.45rem] xl:text-[2.85rem]">
            Know <Before /> your site,{" "}
            <br className="hidden lg:block" />
            SSL or domain lets you down.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted lg:max-w-[36rem]">
            We monitor your sites’ uptime, SSL certificate expiry and domain expiry, and show all
            three on one dashboard.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="bg-accent px-6 py-3 text-sm font-semibold text-white shadow-[4px_4px_0_0_hsl(var(--ink)/0.12)] hover:bg-accent-hover"
            >
              Start free
            </Link>
            <Link
              href="/#how-it-works"
              className="border border-rule bg-surface px-6 py-3 text-sm font-semibold text-ink hover:bg-accent-soft"
            >
              See how it works
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted">Free for 1 site · No card needed</p>

          <div className="mt-10 border-t border-rule pt-5">
            <p className="label-caps">What we check</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {checks.map(({ tag, label, Icon }) => (
                <li key={tag} className="inline-flex items-center gap-2 border border-rule bg-surface px-2.5 py-1.5 text-xs text-ink">
                  <Icon className="h-3.5 w-3.5 text-accent" />
                  <span className="font-mono text-[11px] text-muted">{tag}</span>
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="min-w-0">
          <HeroStage />
        </div>
      </div>
    </section>
  );
}
