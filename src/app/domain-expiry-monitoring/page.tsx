import { FeaturePage } from "@/components/seo/FeaturePage";
import { DomainVisual } from "@/components/marketing/DomainVisual";
import { domainFeature as c } from "@/content/features/domain";
import { pageMeta } from "@/lib/seo-meta";

export const metadata = pageMeta({ ...c, og: "domain-expiry-monitoring" });
export const dynamic = "force-static";

export default function Page() {
  return <FeaturePage content={c} Visual={DomainVisual} tool={{ href: "/tools/domain-expiry-checker", label: "Try the free domain checker" }} />;
}
