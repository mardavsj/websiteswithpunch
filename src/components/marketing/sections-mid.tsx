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
                <div
                  className={`flex min-h-[220px] w-full items-center justify-center bg-accent-soft sm:min-h-[280px] ${reverse ? "md:justify-self-stretch" : ""}`}
                >
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

export function ProductPreviewSection() {
  return (
    <section className="relative overflow-hidden border-b border-rule bg-bg">
      <div className="absolute inset-x-0 top-0 h-1/2 bg-accent-soft/60" aria-hidden />
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
            className="absolute -bottom-4 -right-4 hidden h-full w-full border border-rule bg-ink/5 sm:block"
            aria-hidden
          />
          <div
            className="absolute -bottom-8 -right-8 hidden h-full w-full border border-rule bg-accent-soft sm:block"
            aria-hidden
          />
          <DashboardMock className="relative" />
          <p className="relative mt-8 text-center text-sm text-muted">
            Free = {PLANS.free.siteLimit} site · Pro = up to {PLANS.pro.siteLimit} sites
          </p>
        </div>
      </div>
    </section>
  );
}
