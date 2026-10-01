import Link from "next/link";

/** Faint hairline grid, fading out toward the copy so text stays crisp (no glow). */
const gridStyle = {
  backgroundImage:
    "linear-gradient(hsl(var(--solid-fg) / 0.06) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--solid-fg) / 0.06) 1px, transparent 1px)",
  backgroundSize: "56px 56px",
  maskImage: "linear-gradient(to left, black 15%, transparent 85%)",
  WebkitMaskImage: "linear-gradient(to left, black 15%, transparent 85%)",
} as const;

const readout = [
  { k: "status", v: "200 OK", note: "142 ms", tone: "text-emerald-300" },
  { k: "ssl", v: "valid", note: "74 days left", tone: "text-solid-fg" },
  { k: "domain", v: "registered", note: "212 days left", tone: "text-solid-fg" },
];

/** Slim, terminal-style readout of the first check that runs when a URL is added. */
function FirstCheckReadout() {
  return (
    <figure
      className="w-full max-w-md border border-solid-fg/15 bg-solid font-mono text-[12px] leading-relaxed sm:text-[13px] lg:justify-self-end"
      aria-label="Example first check: status, SSL and domain"
    >
      <div className="flex items-center justify-between gap-3 border-b border-solid-fg/15 px-4 py-2.5 text-solid-fg/55">
        <span className="truncate">first check · example.com</span>
        <span className="shrink-0">just now</span>
      </div>
      <div className="space-y-1.5 px-4 py-4">
        <p className="truncate text-solid-fg/55">
          <span className="text-accent">$</span> check https://example.com
        </p>
        {readout.map((r) => (
          <p key={r.k} className="grid grid-cols-[4.25rem_minmax(0,1fr)] gap-x-2">
            <span className="text-solid-fg/45">{r.k}</span>
            <span className="truncate">
              <span className={r.tone}>{r.v}</span>
              <span className="text-solid-fg/45"> · {r.note}</span>
            </span>
          </p>
        ))}
        <p className="pt-1.5 text-solid-fg/55">→ saved to your dashboard</p>
      </div>
    </figure>
  );
}

export function FinalCtaSection() {
  return (
    <section className="relative overflow-hidden bg-solid text-solid-fg">
      <div aria-hidden className="pointer-events-none absolute inset-0" style={gridStyle} />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16 lg:py-28">
        <div>
          <p className="label-caps !text-solid-fg/55">Get started</p>
          <h2 className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-5xl lg:text-[3.5rem] lg:leading-[1.05]">
            Ready to punch downtime?
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-solid-fg/70 sm:text-lg">
            Add your first URL and we check it right away. Uptime, SSL expiry and domain expiry,
            side by side on one dashboard.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-hover"
            >
              Start free
            </Link>
            <a
              href="#pricing"
              className="inline-flex border border-solid-fg/30 px-6 py-3 text-sm font-semibold text-solid-fg hover:border-solid-fg/60 hover:bg-solid-fg/5"
            >
              See pricing
            </a>
          </div>
          <p className="mt-5 text-sm text-solid-fg/55">Free for 1 site · No card needed</p>
        </div>
        <FirstCheckReadout />
      </div>
    </section>
  );
}
