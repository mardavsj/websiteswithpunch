import { lapses, whyColumns } from "./why-content";

/** Three-column ledger with hairline rules: the lapse, the outside view, and the dashboard view. */
const cols = "lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)]";
const cell = "min-w-0 lg:px-8 lg:first:pl-0 lg:last:pr-0 lg:[&+&]:border-l lg:[&+&]:border-rule";

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
            <h2 className="mt-4 max-w-[16ch] font-display text-[2.1rem] font-medium leading-[1.05] tracking-[-0.03em] text-ink sm:text-5xl">
              Sites rarely fail loudly. They <span className="text-accent">lapse</span> quietly.
            </h2>
          </div>
          <p className="max-w-md text-lg leading-relaxed text-muted lg:justify-self-end">
            The alternative is finding out the hard way, from users, clients or a blank browser tab.
            Here’s what each lapse looks like from the outside, and what you see first.
          </p>
        </div>

        <div className="mt-14 border-t border-rule sm:mt-16">
          <div className={`hidden border-b border-rule py-3 lg:grid ${cols}`} aria-hidden>
            {whyColumns.map((c) => (
              <p key={c} className={`label-caps ${cell}`}>
                {c}
              </p>
            ))}
          </div>

          {lapses.map((l) => (
            <article key={l.id} className={`grid gap-6 border-b border-rule py-8 sm:py-10 lg:gap-0 ${cols}`}>
              <div className={cell}>
                <h3 className="font-display text-2xl font-medium tracking-[-0.02em] text-ink sm:text-[1.75rem]">
                  {l.title}
                </h3>
                <p className="mt-3 max-w-sm leading-relaxed text-muted">{l.impact}</p>
              </div>

              <div className={cell}>
                <MobileLabel>{whyColumns[1]}</MobileLabel>
                <p className="break-all font-mono text-[13px] font-medium text-rose-700 dark:text-rose-300">
                  {l.code}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{l.codeNote}</p>
              </div>

              <div className={cell}>
                <MobileLabel>{whyColumns[2]}</MobileLabel>
                <p className="flex gap-3 leading-relaxed text-ink">
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
