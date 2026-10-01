import Link from "next/link";
import Image from "next/image";
import { customPlanHref } from "@/components/marketing/pricing-content";
import { contactHref } from "@/lib/contact";

const EMAIL = "hello@websiteswithpunch.com";

type FooterLink = { label: string; href: string };

/** Every target exists: homepage section ids, app routes, legal pages and /contact. */
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
    title: "Account",
    links: [
      { label: "Start free", href: "/signup" },
      { label: "Log in", href: "/login" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Your plan", href: "/plan" },
      { label: "Profile", href: "/profile" },
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
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
];

const linkClass =
  "text-sm text-muted transition-colors hover:text-ink focus-visible:text-ink focus-visible:underline focus-visible:outline-none";

function FooterAnchor({ href, label, className = linkClass }: FooterLink & { className?: string }) {
  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

/**
 * Marketing footer: brand column on the left, four link columns on the right, then a quiet
 * bottom bar. Generous padding and one hairline divider; no cards or decoration.
 */
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-rule bg-bg">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-12 pb-14 pt-16 sm:pb-16 sm:pt-20 lg:flex-row lg:gap-20 lg:pb-20">
          <div className="max-w-sm lg:w-72 lg:shrink-0">
            <Link href="/" className="inline-flex items-center gap-2.5 font-display font-medium text-ink">
              <Image src="/logo.svg" alt="" width={32} height={32} unoptimized className="h-8 w-8 object-contain" />
              <span>Websites With Punch</span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted">
              One calm dashboard for the websites you look after, so you spot problems before your
              customers do.
            </p>
            <a
              href={`mailto:${EMAIL}`}
              className="mt-6 inline-block text-sm text-ink underline decoration-rule underline-offset-4 transition-colors hover:decoration-ink"
            >
              {EMAIL}
            </a>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 sm:gap-x-8">
            {columns.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <p className="label-caps">{col.title}</p>
                <ul className="mt-5 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <FooterAnchor {...l} />
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4 border-t border-rule py-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Websites With Punch. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <FooterAnchor href="/terms" label="Terms" className="hover:text-ink" />
            <FooterAnchor href="/privacy" label="Privacy" className="hover:text-ink" />
            <FooterAnchor href={contactHref("general")} label="Contact" className="hover:text-ink" />
          </div>
        </div>
      </div>
    </footer>
  );
}
