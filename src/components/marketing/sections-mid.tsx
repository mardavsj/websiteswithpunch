import { PLANS } from "@/lib/plans";
import { DashboardMock } from "./DashboardMock";
import { monitorRows, painPoints } from "./home-content";

export function FeaturesSection() {
  return (
    <section id="features" className="border-b border-rule bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-xl">
          <h2 className="font-display text-3xl font-medium text-ink sm:text-4xl">What we monitor</h2>
          <p className="mt-3 text-muted">
            Three checks that cover the failure modes that cost real money and trust.
          </p>
        </div>
        <div className="mt-16 space-y-16 sm:space-y-20">
          {monitorRows.map((row, i) => {
            const reverse = i % 2 === 1;
            return (
              <div
                key={row.title}
                className={`grid items-stretch gap-8 md:grid-cols-2 md:gap-14 ${reverse ? "md:[&>*:first-child]:order-2" : ""}`}
              >
                <div className="flex h-full min-h-[220px] w-full items-center justify-center bg-accent-soft sm:min-h-[280px]">
                  <row.Icon className="h-12 w-12 text-accent sm:h-14 sm:w-14" />
                </div>
                <div className="flex flex-col justify-center">
                  <p className="label-caps text-accent">{row.eyebrow}</p>
                  <h3 className="mt-2 font-display text-2xl font-medium text-ink sm:text-3xl">
                    {row.title}
                  </h3>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-muted">{row.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function WhyItMattersSection() {
  return (
    <section className="border-b border-rule bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-16">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <h2 className="font-display text-3xl font-medium text-ink sm:text-4xl">Why it matters</h2>
            <p className="mt-4 text-muted">
              The alternative is finding out the hard way — from users, clients, or a blank browser
              tab.
            </p>
          </aside>
          <div>
            {painPoints.map((p, i) => (
              <article
                key={p.title}
                className={`py-8 first:pt-0 last:pb-0 ${i < painPoints.length - 1 ? "border-b border-rule" : ""}`}
              >
                <div className="flex items-start gap-4">
                  <p.Icon className="mt-1 h-6 w-6 shrink-0 text-accent" />
                  <div>
                    <h3 className="font-display text-xl font-medium text-ink sm:text-2xl">
                      {p.title}
                    </h3>
                    <p className="mt-3 text-base leading-relaxed text-muted">{p.body}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Bottom band of grey waves — left→right, pinned low (not vertically centered). */
function BottomWaveBand() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[38%] min-h-[120px] sm:h-[42%]"
      aria-hidden
    >
      <svg
        className="absolute bottom-0 left-0 h-full w-[160%] max-w-none -translate-x-[12%]"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#e5e5e5"
          d="M0,224 C180,180 320,260 480,220 C640,180 720,140 900,170 C1080,200 1260,250 1440,210 L1440,320 L0,320 Z"
        />
        <path
          fill="#a3a3a3"
          d="M0,248 C200,210 340,280 520,240 C700,200 820,170 980,200 C1140,230 1280,270 1440,240 L1440,320 L0,320 Z"
        />
        <path
          fill="#525252"
          d="M0,272 C160,250 300,300 480,270 C660,240 780,220 960,250 C1140,280 1300,295 1440,268 L1440,320 L0,320 Z"
        />
        <path
          fill="#171717"
          d="M0,296 C140,280 280,310 460,292 C640,274 800,268 980,288 C1160,308 1320,312 1440,294 L1440,320 L0,320 Z"
        />
      </svg>
    </div>
  );
}

export function ProductPreviewSection() {
  return (
    <section className="relative isolate overflow-hidden border-b border-rule bg-bg">
      <BottomWaveBand />

      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-medium text-ink sm:text-4xl">
            One glance. Three signals.
          </h2>
          <p className="mt-3 text-muted">
            Status, SSL days, and domain days — together. Static preview of the dashboard after
            signup.
          </p>
        </div>
        <div className="relative mx-auto mt-14 max-w-3xl">
          <div
            className="absolute -bottom-4 -right-4 hidden h-full w-full border border-rule bg-bg/40 sm:block"
            aria-hidden
          />
          <div
            className="absolute -bottom-8 -right-8 hidden h-full w-full border border-rule bg-accent/15 sm:block"
            aria-hidden
          />
          <DashboardMock className="relative" />
          <p className="relative mt-8 text-center text-sm text-muted">
            Free = {PLANS.free.siteLimit} site · Pro = up to {PLANS.pro.siteLimit} · Business =
            up to {PLANS.business.siteLimit}
          </p>
        </div>
      </div>
    </section>
  );
}
