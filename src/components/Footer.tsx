import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-rule bg-bg">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <img
            src="https://websiteswithpunch.com/logo.png"
            alt="Websites With Punch"
            className="logo-mark mt-0.5 h-8 w-8 object-contain"
          />
          <div>
            <p className="font-display font-medium text-ink">Websites With Punch</p>
            <p className="mt-1 text-sm text-muted">
              Uptime, SSL, and domain monitoring that hits hard.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted">
          <Link href="/#pricing" className="hover:text-ink">
            Pricing
          </Link>
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-ink">
            Terms
          </Link>
          <a href="mailto:hello@websiteswithpunch.com" className="hover:text-ink">
            Contact
          </a>
        </div>
      </div>
      <div className="border-t border-rule py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} websiteswithpunch.com — All rights reserved.
      </div>
    </footer>
  );
}
