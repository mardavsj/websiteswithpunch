import { DomainVisual } from "./DomainVisual";
import { SslVisual } from "./SslVisual";
import { UptimeVisual } from "./UptimeVisual";
import { monitorRows } from "./home-content";

const monitorVisuals = {
  uptime: UptimeVisual,
  ssl: SslVisual,
  domain: DomainVisual,
} as const;

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
            const Visual = monitorVisuals[row.visual];
            return (
              <div
                key={row.title}
                className={`grid min-w-0 items-stretch gap-8 md:grid-cols-2 md:gap-14 ${reverse ? "md:[&>*:first-child]:order-2" : ""}`}
              >
                <Visual />
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
