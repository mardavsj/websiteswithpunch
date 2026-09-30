import { lapses, whyColumns } from "./why-content";

/** Three-column table: the lapse, the outside view, and the dashboard view. */
const cols = "lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)]";
const pad = "p-5 sm:p-6 lg:px-7 lg:py-8";
const tint = "bg-[hsl(var(--ink)/0.025)]";
/** Every divider meets the outer border: stacked cells split by full-width rules, lg columns by full-height rules. */
const cell = "min-w-0 [&+&]:border-t [&+&]:border-rule lg:[&+&]:border-l lg:[&+&]:border-t-0";

function MobileLabel({ children }: { children: string }) {
  return <p className="label-caps mb-2 lg:hidden">{children}</p>;
}

export function WhyItMattersSection() {
  return (
    <section className="border-b border-rule bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
          <div>
            <p className="label-caps">Why it matters</p>
            <h2 className="mt-4 font-display text-3xl font-medium text-ink sm:text-4xl">
              Sites rarely fail loudly. They <span className="text-accent">lapse</span> quietly.
            </h2>
          </div>
          <p className="max-w-md text-muted lg:justify-self-end">
            The alternative is finding out the hard way, from users, clients or a blank browser tab.
            Here’s what each lapse looks like from the outside, and what you see first.
          </p>
        </div>

        <div className="mt-14 space-y-4 sm:mt-16 lg:space-y-0 lg:border lg:border-rule">
          <div className={`hidden border-b border-rule lg:grid ${tint} ${cols}`} aria-hidden>
            {whyColumns.map((c) => (
              <p key={c} className={`label-caps px-7 py-3.5 ${cell}`}>
                {c}
              </p>
            ))}
          </div>

          {lapses.map((l) => (
            <article
              key={l.id}
              className={`grid border border-rule lg:border-0 lg:border-b lg:last:border-b-0 ${cols}`}
            >
              <div className={`${cell} ${pad} ${tint} lg:bg-transparent`}>
                <h3 className="font-display text-xl font-medium text-ink">{l.title}</h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{l.impact}</p>
              </div>

              <div className={`${cell} ${pad}`}>
                <MobileLabel>{whyColumns[1]}</MobileLabel>
                <p className="break-all font-mono text-[13px] font-medium text-rose-700 dark:text-rose-300">
                  {l.code}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{l.codeNote}</p>
              </div>

              <div className={`${cell} ${pad}`}>
                <MobileLabel>{whyColumns[2]}</MobileLabel>
                <p className="flex gap-3 text-sm leading-relaxed text-ink">
                  <span className="mt-[0.65em] h-0.5 w-4 shrink-0 bg-accent" aria-hidden />
                  {l.weShow}
                </p>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-8 text-sm text-muted">
          All three sit on one dashboard, with a manual recheck and opt-in auto refresh when you want
          to watch a site live.
        </p>
      </div>
    </section>
  );
}
