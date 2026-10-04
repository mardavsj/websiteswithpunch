import Link from "next/link";
import { IconGlobe, IconLock, IconPulse } from "@/components/marketing/icons";

export const TOOLS = [
  { href: "/tools/ssl-checker", short: "SSL checker", Icon: IconLock },
  { href: "/tools/domain-expiry-checker", short: "Domain expiry", Icon: IconGlobe },
  { href: "/tools/website-down-checker", short: "Website down", Icon: IconPulse },
] as const;

/** Pick-a-tool row shared by the tool pages: the current tool is highlighted, the others are links. */
export function ToolSwitcher({ current }: { current: string }) {
  return (
    <nav aria-label="Free tools" className="grid grid-cols-3 border border-rule bg-surface text-xs sm:text-sm">
      {TOOLS.map(({ href, short, Icon }) => {
        const on = href === current;
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            className={`flex min-h-11 items-center justify-center gap-1.5 px-2 text-center font-medium transition-colors [&+&]:border-l [&+&]:border-rule ${
              on ? "bg-accent text-white" : "text-muted hover:bg-bg hover:text-ink"
            }`}
          >
            <Icon className="hidden h-4 w-4 shrink-0 sm:block" />
            {short}
          </Link>
        );
      })}
    </nav>
  );
}
