import type { MetadataRoute } from "next";
import { FEATURE_LINKS, TOOL_LINKS } from "@/content/links";
import { SITE_URL } from "@/lib/site-config";

/** Public, indexable routes only (auth, app and API pages are excluded). */
export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date("2026-10-04");
  const page = (path: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly" = "monthly") => ({
    url: `${SITE_URL}${path}`,
    lastModified: updated,
    changeFrequency,
    priority,
  });
  return [
    page("/", 1, "weekly"),
    ...FEATURE_LINKS.map((l) => page(l.href, 0.8)),
    page("/tools", 0.7),
    ...TOOL_LINKS.map((l) => page(l.href, 0.8)),
    page("/contact", 0.5, "yearly"),
    page("/terms", 0.3, "yearly"),
    page("/privacy", 0.3, "yearly"),
  ];
}
