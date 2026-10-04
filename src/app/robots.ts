import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";

const PRIVATE = ["/api/", "/dashboard", "/plan", "/profile", "/reset-password", "/verify-email"];

/**
 * Marketing pages and free tools are crawlable; the app, API and auth flows are not.
 * Search and AI-search crawlers are named explicitly so it's clear they're welcome on the
 * public pages (same rules as everyone else).
 */
const NAMED_BOTS = [
  "Googlebot",
  "Bingbot",
  "Applebot",
  "Google-Extended",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "ClaudeBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: NAMED_BOTS, allow: "/", disallow: PRIVATE },
      { userAgent: "*", allow: "/", disallow: PRIVATE },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
