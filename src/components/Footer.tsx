import Link from "next/link";
import Image from "next/image";
import { customPlanHref } from "@/components/marketing/pricing-content";

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
      { label: "Contact us", href: "/contact" },
      { label: "Billing help", href: "/contact?topic=billing" },
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
  "text-sm text-muted transition-colors hover:text-ink focus-visible:text-ink focus-visible:outline-none focus-visible:underline";

function FooterAnchor({ href, label, className = linkClass }: FooterLink & { className?: string }) {
  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-rule bg-bg">
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:px-6 sm:pt-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 lg:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))] lg:gap-x-8">
          <div className="col-span-2 sm:col-span-4 lg:col-span-1 lg:pr-8">
            <Link href="/" className="inline-flex items-center gap-2.5 font-display font-medium text-ink">
              <Image src="/logo.svg" alt="" width={32} height={32} unoptimized className="h-8 w-8 object-contain" />
              <span>Websites With Punch</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Uptime, SSL and domain expiry monitoring for the sites you can&apos;t afford to lose.
            </p>
            <a
              href={`mailto:${EMAIL}`}
              className="mt-4 inline-block text-sm font-medium text-ink underline-offset-4 hover:underline"
            >
              {EMAIL}
            </a>
          </div>
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="label-caps">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
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
      <div className="border-t border-rule">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {year} Websites With Punch. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <FooterAnchor href="/terms" label="Terms" className="hover:text-ink" />
            <FooterAnchor href="/privacy" label="Privacy" className="hover:text-ink" />
            <FooterAnchor href="/contact" label="Contact" className="hover:text-ink" />
          </div>
        </div>
      </div>
    </footer>
  );
}
