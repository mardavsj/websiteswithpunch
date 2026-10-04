import Link from "next/link";
import { HeroDots } from "./HeroDots";
import { HeroStage } from "./HeroStage";
import { HeroCheckForm } from "./hero-check/HeroCheckForm";
import { HeroCheckProvider } from "./hero-check/HeroCheckProvider";
import { HeroResultSlot } from "./hero-check/HeroResultSlot";
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
  // Two-column row, then the down checker (left column width) and its result card (full width)
  // straight below it. Top-aligned with a viewport-relative top padding, so opening the card
  // only grows the hero (min-h: the viewport below the 65px navbar) and nothing above it moves.
  // Phones: text, checker, result, then the product preview.
  return (
    <section className="relative isolate overflow-hidden border-b border-rule bg-bg lg:min-h-[calc(100svh_-_65px)]">
      <HeroDots />
      <HeroCheckProvider>
        <div className="mx-auto grid w-full max-w-6xl gap-x-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1.38fr)_minmax(0,1fr)] lg:items-center lg:pb-16 lg:pt-[clamp(3rem,7svh,6rem)]">
          <div className="order-1 min-w-0 lg:order-none">
            <h1 className="max-w-[17ch] font-display text-[2.3rem] font-medium leading-[1.04] tracking-[-0.035em] text-ink sm:text-[3.25rem] lg:max-w-none lg:text-[2.45rem] xl:text-[2.85rem]">
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

          <div className="order-4 mt-14 min-w-0 lg:order-none lg:mt-0">
            <HeroStage />
          </div>
          <div className="order-2 mt-12 min-w-0 lg:order-none lg:col-start-1 lg:mt-16">
            <HeroCheckForm />
          </div>
          <HeroResultSlot />
        </div>
      </HeroCheckProvider>
    </section>
  );
}
