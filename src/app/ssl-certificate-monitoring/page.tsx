import { FeaturePage } from "@/components/seo/FeaturePage";
import { SslVisual } from "@/components/marketing/SslVisual";
import { sslFeature as c } from "@/content/features/ssl";
import { pageMeta } from "@/lib/seo-meta";

export const metadata = pageMeta({ ...c, og: "ssl-certificate-monitoring" });
export const dynamic = "force-static";

export default function Page() {
  return <FeaturePage content={c} Visual={SslVisual} tool={{ href: "/tools/ssl-checker", label: "Try the free SSL checker" }} />;
}
