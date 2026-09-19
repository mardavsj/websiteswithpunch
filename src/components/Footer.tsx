import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-semibold text-slate-900">Websites With Punch</p>
          <p className="mt-1 text-sm text-slate-500">
            Uptime, SSL, and domain monitoring that hits hard.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
          <Link href="/#pricing" className="hover:text-slate-900">
            Pricing
          </Link>
          <Link href="/privacy" className="hover:text-slate-900">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-slate-900">
            Terms
          </Link>
          <a href="mailto:hello@websiteswithpunch.com" className="hover:text-slate-900">
            Contact
          </a>
        </div>
      </div>
      <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} websiteswithpunch.com — All rights reserved.
      </div>
    </footer>
  );
}
