import Link from "next/link";
import Image from "next/image";
import { customPlanHref } from "@/components/marketing/pricing-content";
import { contactHref } from "@/lib/contact";
import { FooterThemeSwitch } from "@/components/FooterThemeSwitch";

const EMAIL = "hello@websiteswithpunch.com";

type FooterLink = { label: string; href: string };

/** Honest links only: homepage sections and the contact form with its topic preselected. */
const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "What we monitor", href: "/#features" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Dashboard preview", href: "/#dashboard-preview" },
      { label: "Who it's for", href: "/#who-its-for" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "FAQ", href: "/#faq" },
      { label: "Contact us", href: contactHref("general") },
      { label: "Billing help", href: contactHref("billing") },
      { label: "Custom site limits", href: customPlanHref },
    ],
  },
];

const legal: FooterLink[] = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
];

const linkClass =
  "text-sm text-muted transition-colors hover:text-ink focus-visible:text-ink focus-visible:underline focus-visible:outline-none";

/**
 * Public footer: brand column and two link columns, a bottom bar (copyright, legal, theme), and
 * the name set as an oversized, cropped watermark. No call to action here: the navbar has
 * "Start free" everywhere and the homepage ends with its own CTA right above.
 */
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="overflow-hidden border-t border-rule bg-bg">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 pb-16 pt-16 sm:pt-20 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-24 lg:pb-20">
          <div>
            <Link href="/" className="inline-flex items-center gap-3 text-ink">
              <Image src="/logo.svg" alt="" width={36} height={36} unoptimized className="h-9 w-9 object-contain" />
              <span className="font-display text-lg font-medium tracking-tight">Websites With Punch</span>
            </Link>
            <p className="mt-6 max-w-sm font-display text-xl font-medium leading-snug tracking-tight text-ink sm:text-2xl">
              Spot website problems before your customers do.
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
              One calm dashboard for the websites you look after.
            </p>
            <p className="mt-8 text-xs text-muted">Questions? Write to us</p>
            <a
              href={`mailto:${EMAIL}`}
              className="mt-1.5 inline-block font-display text-base font-medium text-ink underline decoration-rule underline-offset-[6px] transition-colors hover:decoration-ink"
            >
              {EMAIL}
            </a>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:gap-x-10">
            {columns.map((col) => (
              <nav key={col.title} aria-labelledby={`footer-${col.title}`}>
                <h2 id={`footer-${col.title}`} className="font-display text-sm font-medium text-ink">
                  {col.title}
                </h2>
                <ul className="mt-5 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className={linkClass}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-5 border-t border-rule py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <p>© {year} Websites With Punch. All rights reserved. | A product by Makvion Technologies.</p>
          </div>
          <nav aria-label="Legal" className="flex gap-5 ml-auto">
            {legal.map((l) => (
              <Link key={l.href} href={l.href} className="transition-colors hover:text-ink">
                {l.label}
              </Link>
            ))}
          </nav>
          <FooterThemeSwitch />
        </div>
      </div>
      <div aria-hidden className="pointer-events-none mx-auto max-w-6xl select-none px-4 sm:px-6">
        <svg viewBox="0 0 1000 96" className="block w-full text-ink/[0.06]">
          <text
            x="0"
            y="118"
            textLength="1000"
            lengthAdjust="spacingAndGlyphs"
            fill="currentColor"
            className="font-display"
            fontSize="136"
            fontWeight="500"
            letterSpacing="-4"
          >
            Websites With Punch
          </text>
        </svg>
      </div>
    </footer>
  );
}
