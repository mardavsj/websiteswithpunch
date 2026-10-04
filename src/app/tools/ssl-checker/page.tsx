import { ToolPage } from "@/components/seo/ToolPage";
import { sslChecker as c } from "@/content/tools/ssl-checker";
import { pageMeta } from "@/lib/seo-meta";

export const metadata = pageMeta({ ...c, og: "ssl-checker" });
export const dynamic = "force-static";

export default function Page() {
  return (
    <ToolPage content={c} kind="ssl" crumb="SSL checker" label="Domain" placeholder="example.com" button="Check SSL" />
  );
}
