"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const ADMIN_TABS: Array<[string, string]> = [
  ["/admin", "Overview"],
  ["/admin/users", "Users"],
  ["/admin/payouts", "Payouts"],
  ["/admin/referrals", "Referrals"],
  ["/admin/messages", "Messages"],
  ["/admin/alerts", "Alerts"],
  ["/admin/audit", "Audit log"],
];

/** Sidebar on desktop, scrollable tabs on mobile. usePathname is the same on server and client. */
export function AdminNav() {
  const path = usePathname() ?? "";
  return (
    <nav aria-label="Admin" className="-mx-4 overflow-x-auto border-b border-rule px-4 md:mx-0 md:overflow-visible md:border-b-0 md:px-0">
      <ul className="flex gap-1 md:flex-col md:gap-0.5">
        {ADMIN_TABS.map(([href, label]) => {
          const on = href === "/admin" ? path === href : path.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={on ? "page" : undefined}
                className={`block whitespace-nowrap border-b-2 px-3 py-2.5 text-sm md:border-b-0 md:border-l-2 md:py-2 ${on ? "border-accent font-medium text-ink md:bg-accent-soft" : "border-transparent text-muted hover:text-ink"}`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
