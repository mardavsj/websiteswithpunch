import Link from "next/link";
import type { ComponentType } from "react";
import { relatedFor } from "@/content/links";
import { Article } from "./Article";
import { Breadcrumbs } from "./Breadcrumbs";
import { FaqBlock } from "./FaqBlock";
import { RelatedLinks } from "./RelatedLinks";
import { SoftCta } from "./SoftCta";
import type { ArticleSection, Faq } from "./types";

export type FeatureContent = {
  path: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  intro: string;
  facts: string[];
  sections: ArticleSection[];
  faqs: Faq[];
};

type Props = { content: FeatureContent; Visual: ComponentType; tool: { href: string; label: string } };

/** Feature landing page: hero with the homepage's product visual, then explainer, FAQ and links. */
export function FeaturePage({ content: c, Visual, tool }: Props) {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
      <Breadcrumbs items={[{ name: c.eyebrow, href: c.path }]} />
      <div className="mt-8 grid min-w-0 items-center gap-10 md:grid-cols-2 md:gap-14">
        <div className="min-w-0">
          <p className="label-caps text-accent">{c.eyebrow}</p>
          <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink sm:text-[2.6rem] sm:leading-[1.1]">{c.h1}</h1>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">{c.intro}</p>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {c.facts.map((f) => (
              <li key={f} className="flex gap-2.5 text-sm text-ink">
                <span aria-hidden className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 bg-accent" />
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/signup" className="inline-flex items-center bg-accent px-5 py-3 text-sm font-medium text-white hover:bg-accent-hover">
              Start free
            </Link>
            <Link href={tool.href} className="inline-flex items-center border border-rule px-5 py-3 text-sm font-medium text-ink hover:bg-surface">
              {tool.label}
            </Link>
          </div>
        </div>
        <div className="min-w-0">
          <Visual />
        </div>
      </div>
      <div className="mx-auto mt-20 max-w-3xl space-y-16">
        <Article sections={c.sections} />
        <FaqBlock faqs={c.faqs} />
        <SoftCta
          title="Start monitoring for free"
          body="The free plan covers one site with uptime, SSL and domain checks on one dashboard. Pro covers 10 sites and Business 50. No card needed to start."
        />
        <RelatedLinks title="Related" links={relatedFor(c.path, "features")} />
      </div>
    </div>
  );
}
