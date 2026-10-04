import { FeaturePage } from "@/components/seo/FeaturePage";
import { UptimeVisual } from "@/components/marketing/UptimeVisual";
import { uptimeFeature as c } from "@/content/features/uptime";
import { pageMeta } from "@/lib/seo-meta";

export const metadata = pageMeta({ ...c, og: "uptime-monitoring" });
export const dynamic = "force-static";

export default function Page() {
  return <FeaturePage content={c} Visual={UptimeVisual} tool={{ href: "/tools/website-down-checker", label: "Check if a site is down" }} />;
}
