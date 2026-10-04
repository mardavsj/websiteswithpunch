import Link from "next/link";
import Image from "next/image";

/** Logged-in app pages only (see SiteChrome): the original slim footer, with app links. */
const links = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Your plan", href: "/plan" },
  { label: "Contact", href: "/contact?topic=general" },
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "Refunds", href: "/refund-policy" },
];

export function AppFooter() {
  return (
    <footer className="border-t border-rule bg-bg">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <Image
            src="/logo.svg"
            alt="Websites With Punch"
            width={32}
            height={32}
            unoptimized
            className="mt-0.5 h-8 w-8 object-contain"
          />
          <div>
            <p className="font-display font-medium text-ink">Websites With Punch</p>
            <p className="mt-1 text-sm text-muted">
              Uptime, SSL, and domain monitoring that hits hard.
            </p>
          </div>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-4 text-sm text-muted">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-rule py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} Websites With Punch. All rights reserved. | A product by Makvion Technologies,
        India. | hello@websiteswithpunch.com
      </div>
    </footer>
  );
}
