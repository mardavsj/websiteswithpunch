import Link from "next/link";
import { HeroPreview } from "./HeroPreview";
import { IconGlobe, IconLock, IconPulse } from "./icons";

const checks = [
  { label: "Uptime & response time", Icon: IconPulse },
  { label: "SSL certificate expiry", Icon: IconLock },
  { label: "Domain expiry", Icon: IconGlobe },
];

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden border-b border-rule bg-solid text-solid-fg">
      <div className="absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--solid-fg)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--solid-fg)/0.05)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_80%_70%_at_60%_40%,black,transparent)]" />
        <div className="absolute -right-40 top-1/4 h-[36rem] w-[36rem] rounded-full bg-accent/20 blur-[120px]" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12 lg:py-24">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 border border-solid-fg/20 bg-solid-fg/10 px-3 py-1.5 text-xs font-medium text-solid-fg/90">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            Website health monitoring
          </p>

          <h1 className="mt-6 font-display text-4xl font-medium tracking-tight text-solid-fg sm:text-5xl lg:text-[3.4rem] lg:leading-[1.05]">
            Know <span className="text-accent">before</span> your site, SSL or domain lets you down.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-solid-fg/70">
            We monitor your sites’ uptime, SSL certificate expiry and domain expiry, and show all
            three on one dashboard.
          </p>

          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-solid-fg/80">
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
              className="border border-solid-fg/25 px-6 py-3 text-sm font-semibold text-solid-fg hover:bg-solid-fg/10"
            >
              See how it works
            </Link>
          </div>
          <p className="mt-5 text-sm text-solid-fg/55">Free for 1 site · No card needed</p>
        </div>

        <div className="min-w-0 lg:pl-4">
          <HeroPreview />
        </div>
      </div>
    </section>
  );
}
