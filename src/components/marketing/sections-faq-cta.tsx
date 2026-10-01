import { faqs } from "./home-content";

export function FaqSection() {
  return (
    <section className="border-b border-rule bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)] lg:gap-16">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <h2 className="font-display text-3xl font-medium text-ink sm:text-4xl">FAQ</h2>
            <p className="mt-3 text-muted">Straight answers before you sign up.</p>
          </aside>
          <dl>
            {faqs.map((item) => (
              <div key={item.q} className="border-b border-rule py-6 first:pt-0">
                <dt className="font-display text-base font-medium text-ink sm:text-lg">{item.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

export { FinalCtaSection } from "./FinalCtaSection";
