import Link from "next/link";
import { HeroPreview } from "./HeroPreview";
import { IconGlobe, IconLock, IconPulse } from "./icons";

const checks = [
  { label: "Uptime & response time", Icon: IconPulse },
  { label: "SSL certificate expiry", Icon: IconLock },
  { label: "Domain expiry", Icon: IconGlobe },
];

export function HeroSection() {
  // lg+: fill the viewport below the 65px sticky navbar, capped so tall screens don't balloon.
  return (
    <section className="relative overflow-hidden border-b border-rule bg-bg lg:flex lg:min-h-[min(calc(100svh_-_65px),1024px)] lg:items-center">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1.33fr)_minmax(0,1fr)] lg:gap-12 lg:py-24">
        <div className="min-w-0">
          <h1 className="max-w-[17ch] font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl lg:max-w-none lg:text-[2.35rem] lg:leading-[1.1] xl:text-[2.75rem]">
            Know <span className="text-accent">before</span> your site,{" "}
            <br className="hidden lg:block" />
            SSL or domain lets you down.
          </h1>
          <p className="mt-5 max-w-lg text-lg lg:max-w-[36rem] leading-relaxed text-muted">
            We monitor your sites’ uptime, SSL certificate expiry and domain expiry, and show all
            three on one dashboard.
          </p>

          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink">
            {checks.map(({ label, Icon }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-accent" />
                {label}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-hover"
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
          <p className="mt-5 text-sm text-muted">Free for 1 site · No card needed</p>
        </div>

        <div className="min-w-0">
          <HeroPreview />
        </div>
      </div>
    </section>
  );
}
