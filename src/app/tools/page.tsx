import { HubHero } from "@/components/tools-hub/HubHero";
import { HubWhy } from "@/components/tools-hub/HubWhy";
import { ToolCards } from "@/components/tools-hub/ToolCards";
import { JsonLd } from "@/components/seo/JsonLd";
import { TOOL_LINKS } from "@/content/links";
import { pageMeta } from "@/lib/seo-meta";
import { SITE_URL } from "@/lib/site-config";

export const metadata = pageMeta({
  path: "/tools",
  title: "Free Website Tools: SSL, Domain Expiry & Down Checker",
  description:
    "Free website health tools: check SSL certificate expiry, look up a domain's expiry date over RDAP and test whether a website is down. No signup.",
  og: "tools",
});
export const dynamic = "force-static";

const itemList = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Free website health tools",
  itemListElement: TOOL_LINKS.map((t, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: t.title,
    url: `${SITE_URL}${t.href}`,
    description: t.body,
  })),
};

/** Free tools hub: hero with a quick-start, a card per tool, why use them, and a soft CTA. */
export default function ToolsIndex() {
  return (
    <div>
      <JsonLd data={itemList} />
      <HubHero />
      <ToolCards />
      <HubWhy />
    </div>
  );
}
