import { StatusBadge } from "@/components/StatusBadge";
import { IconGlobe, IconLock, IconPulse } from "@/components/marketing/icons";
import { previewSites } from "@/components/marketing/preview-data";

const features = [
  {
    Icon: IconPulse,
    title: "Uptime and response time",
    body: "Scheduled checks record up or down, the status code and latency, with history for each site.",
  },
  {
    Icon: IconLock,
    title: "SSL days left",
    body: "Read from each HTTPS certificate. Turns amber at 30 days and red at 7.",
  },
  {
    Icon: IconGlobe,
    title: "Domain days left",
    body: "From best-effort RDAP/WHOIS lookups, with the same thresholds.",
  },
];

function daysTone(days: number) {
  if (days <= 7) return "text-rose-700 dark:text-rose-300";
  if (days <= 30) return "text-amber-700 dark:text-amber-300";
  return "text-ink";
}

/** Desktop-only side panel on auth pages: a small dashboard preview and the three real signals. */
export function AuthBrandPanel() {
  const sites = previewSites.slice(0, 3);
  return (
    <aside className="hidden border-l border-rule bg-surface lg:flex lg:flex-col lg:justify-center">
      <div className="mx-auto w-full max-w-lg px-12 py-14 xl:px-16">
        <p className="text-xs font-medium uppercase tracking-wider text-accent">
          Website health monitoring
        </p>
        <h2 className="mt-3 font-display text-2xl font-medium leading-snug text-ink">
          Uptime, SSL and domain expiry for every site, in one dashboard.
        </h2>

        <figure className="mt-8 border border-rule bg-bg" aria-label="Example dashboard">
          <div className="flex items-center justify-between border-b border-rule px-4 py-2.5">
            <span className="text-xs font-medium text-ink">Your sites</span>
            <figcaption className="text-[11px] text-muted">Example data</figcaption>
          </div>
          <ul className="divide-y divide-rule">
            {sites.map((s) => (
              <li key={s.url} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{s.name}</p>
                    <p className="truncate text-xs text-muted">{s.url.replace(/^https?:\/\//, "")}</p>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
                <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs tabular-nums text-muted">
                  <span>
                    {s.latencyMs} ms · {s.code}
                  </span>
                  <span>
                    SSL <span className={daysTone(s.sslDays)}>{s.sslDays} days</span>
                  </span>
                  <span>
                    Domain <span className={daysTone(s.domainDays)}>{s.domainDays} days</span>
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </figure>

        <ul className="mt-8 space-y-5">
          {features.map(({ Icon, title, body }) => (
            <li key={title} className="flex gap-3">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <p className="text-sm font-medium text-ink">{title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
