import Link from "next/link";
import type { RelatedLink } from "./types";

/** Cross-links between the tools and feature pages (internal linking with real descriptions). */
export function RelatedLinks({ title = "Related", links }: { title?: string; links: RelatedLink[] }) {
  return (
    <section aria-labelledby="related-title">
      <h2 id="related-title" className="font-display text-xl font-medium tracking-tight text-ink">{title}</h2>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="group block h-full border border-rule bg-bg p-5 transition-colors hover:bg-surface">
              <span className="font-display text-base font-medium text-ink group-hover:text-accent">{l.title} →</span>
              <span className="mt-1.5 block text-sm leading-relaxed text-muted">{l.body}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
