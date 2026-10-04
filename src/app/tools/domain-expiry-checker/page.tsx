import { ToolPage } from "@/components/seo/ToolPage";
import { domainChecker as c } from "@/content/tools/domain-expiry-checker";
import { pageMeta } from "@/lib/seo-meta";

export const metadata = pageMeta({ ...c, og: "domain-expiry-checker" });
export const dynamic = "force-static";

export default function Page() {
  return (
    <ToolPage content={c} kind="domain" crumb="Domain expiry checker" label="Domain" placeholder="example.com" button="Check expiry" />
  );
}
