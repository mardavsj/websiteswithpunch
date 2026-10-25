"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NewPill } from "./NewPill";

export const ADMIN_TABS: Array<[string, string]> = [
  ["/admin", "Overview"],
  ["/admin/users", "Users"],
  ["/admin/sites", "Sites"],
  ["/admin/payouts", "Payouts"],
  ["/admin/referrals", "Referrals"],
  ["/admin/messages", "Messages"],
  ["/admin/alerts", "Alerts"],
  ["/admin/audit", "Audit log"],
];

/** Sidebar on desktop, scrollable tabs on mobile. usePathname is the same on server and client. */
export function AdminNav({ counts = {} }: { counts?: Record<string, number> }) {
  const path = usePathname() ?? "";
  return (
    <nav aria-label="Admin" className="-mx-4 overflow-x-auto border-b border-rule px-4 md:mx-0 md:overflow-visible md:border-b-0 md:px-0">
      <ul className="flex gap-1 md:flex-col md:gap-0.5">
        {ADMIN_TABS.map(([href, label]) => {
          const on = href === "/admin" ? path === href : path.startsWith(href);
          const fresh = (counts[href] ?? 0) > 0;
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={on ? "page" : undefined}
                className={`flex items-center justify-between gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm md:border-b-0 md:border-l-2 md:py-2 ${on ? "border-accent font-medium text-ink md:bg-accent-soft" : "border-transparent text-muted hover:text-ink"} ${fresh ? "!font-semibold !text-zinc-900 dark:!text-white md:shadow-[inset_2px_0_0_#059669]" : ""}`}
              >
                {label}
                <NewPill n={counts[href] ?? 0} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
