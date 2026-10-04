import { JsonLd } from "./JsonLd";
import type { Faq } from "./types";

/** Visible FAQ plus FAQPage structured data built from the same list, so they always match. */
export function FaqBlock({ faqs, title = "Frequently asked questions" }: { faqs: Faq[]; title?: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <section aria-labelledby="faq-title">
      <JsonLd data={data} />
      <h2 id="faq-title" className="font-display text-2xl font-medium tracking-tight text-ink sm:text-[1.7rem]">
        {title}
      </h2>
      <dl className="mt-6 border-t border-rule">
        {faqs.map((f) => (
          <div key={f.q} className="border-b border-rule py-5">
            <dt className="font-display text-base font-medium text-ink sm:text-lg">{f.q}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{f.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
