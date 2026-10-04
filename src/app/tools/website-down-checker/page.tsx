import { ToolPage } from "@/components/seo/ToolPage";
import { downChecker as c } from "@/content/tools/website-down-checker";
import { pageMeta } from "@/lib/seo-meta";

export const metadata = pageMeta({ ...c, og: "website-down-checker" });
export const dynamic = "force-static";

export default function Page() {
  return (
    <ToolPage content={c} kind="down" crumb="Website down checker" label="Website" placeholder="example.com" button="Check website" />
  );
}
