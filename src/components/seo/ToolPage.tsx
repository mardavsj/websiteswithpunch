import { IconGlobe, IconLock, IconPulse } from "@/components/marketing/icons";
import { ToolForm } from "@/components/tools/ToolForm";
import { StageChip, ToolStage } from "@/components/tools/ToolStage";
import { ToolSwitcher } from "@/components/tools/ToolSwitcher";
import type { ToolKind } from "@/components/tools/ToolResult";
import { relatedFor } from "@/content/links";
import { SITE_NAME, SITE_URL } from "@/lib/site-config";
import { Article } from "./Article";
import { Breadcrumbs } from "./Breadcrumbs";
import { FaqBlock } from "./FaqBlock";
import { JsonLd } from "./JsonLd";
import { RelatedLinks } from "./RelatedLinks";
import { SoftCta } from "./SoftCta";
import type { ArticleSection, Faq } from "./types";

export type ToolContent = {
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  sections: ArticleSection[];
  faqs: Faq[];
  cta: string;
};

const ICONS = { ssl: IconLock, domain: IconGlobe, down: IconPulse } as const;

type Props = { content: ToolContent; kind: ToolKind; crumb: string; label: string; placeholder: string; button: string };

/** Free tool page: the checker on top, then a server-rendered explainer, FAQ and soft CTA. */
export function ToolPage({ content: c, kind, crumb, label, placeholder, button }: Props) {
  const Icon = ICONS[kind];
  const app = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${c.h1} by ${SITE_NAME}`,
    url: `${SITE_URL}${c.path}`,
    description: c.description,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
      <JsonLd data={app} />
      <Breadcrumbs items={[{ name: "Free tools", href: "/tools" }, { name: crumb, href: c.path }]} />
      <p className="label-caps mt-8 text-accent">Free tool</p>
      <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink sm:text-[2.6rem] sm:leading-[1.1]">{c.h1}</h1>
      <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">{c.intro}</p>
      <div className="mt-8">
        <ToolSwitcher current={c.path} />
      </div>
      <ToolStage className="mt-4" icon={<Icon className="h-4 w-4" />} title={crumb} badge={<StageChip>Free · no signup</StageChip>}>
        <ToolForm kind={kind} label={label} placeholder={placeholder} button={button} />
      </ToolStage>
      <div className="mt-16">
        <Article sections={c.sections} />
      </div>
      <div className="mt-16">
        <SoftCta body={c.cta} />
      </div>
      <div className="mt-16">
        <FaqBlock faqs={c.faqs} />
      </div>
      <div className="mt-16">
        <RelatedLinks title="More free tools and guides" links={relatedFor(c.path, "tools")} />
      </div>
    </div>
  );
}
