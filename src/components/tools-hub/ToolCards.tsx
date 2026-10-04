import Link from "next/link";
import type { ComponentType } from "react";
import { DomainPreview } from "./preview-domain";
import { DownPreview } from "./preview-down";
import { SslPreview } from "./preview-ssl";

const CARDS: { href: string; title: string; value: string; button: string; Preview: ComponentType }[] = [
  {
    href: "/tools/ssl-checker",
    title: "SSL checker",
    value: "Issuer, expiry date, days left, covered hostnames and whether browsers trust it.",
    button: "Check an SSL certificate",
    Preview: SslPreview,
  },
  {
    href: "/tools/domain-expiry-checker",
    title: "Domain expiry checker",
    value: "Expiry date, days left and registrar, read live from the registry over RDAP.",
    button: "Check a domain's expiry",
    Preview: DomainPreview,
  },
  {
    href: "/tools/website-down-checker",
    title: "Website down checker",
    value: "Down for everyone or just you? Status code, response time and final URL.",
    button: "Check if a site is down",
    Preview: DownPreview,
  },
];

/** One card per tool: a mini preview of its real result, a one-line value and a clear button. */
export function ToolCards() {
  return (
    <section id="tools" className="border-b border-rule bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-xl">
          <h2 className="font-display text-3xl font-medium text-ink sm:text-4xl">Pick a tool</h2>
          <p className="mt-3 text-muted">Each one answers a single question, then explains the result and how to fix it.</p>
        </div>
        <ul className="mt-14 grid gap-6 lg:grid-cols-3">
          {CARDS.map(({ href, title, value, button, Preview }) => (
            <li key={href} className="flex min-w-0 flex-col border border-rule bg-surface">
              <Preview />
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <h3 className="font-display text-xl font-medium text-ink">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{value}</p>
                <Link
                  href={href}
                  className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover"
                >
                  {button} <span aria-hidden>→</span>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
