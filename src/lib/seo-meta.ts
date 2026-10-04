import type { Metadata } from "next";
import { SITE_NAME } from "./site-config";

/**
 * Metadata for a public marketing page: absolute title, canonical URL and a static Open Graph
 * image from /public/og (static PNGs, no runtime image generation).
 */
export function pageMeta(p: { path: string; title: string; description: string; og: string }): Metadata {
  const image = { url: `/og/${p.og}.png`, width: 1200, height: 630, alt: p.title };
  return {
    title: { absolute: p.title },
    description: p.description,
    alternates: { canonical: p.path },
    openGraph: { type: "website", siteName: SITE_NAME, url: p.path, title: p.title, description: p.description, images: [image] },
    twitter: { card: "summary_large_image", title: p.title, description: p.description, images: [image.url] },
  };
}
