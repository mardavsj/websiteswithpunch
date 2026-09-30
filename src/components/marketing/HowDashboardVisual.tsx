import type { ReactNode } from "react";
import { DaysChip, appear, delay } from "./how-parts";
import { OkPill, Panel, VisualStage } from "./monitor-visual-parts";

const BARS = 30;

function SiteRow({
  name,
  host,
  children,
}: {
  name: string;
  host: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-display text-sm font-medium text-ink">{name}</span>
          <OkPill>Up</OkPill>
        </div>
        <span className="w-full min-w-0 truncate text-[11px] text-accent sm:w-auto">{host}</span>
      </div>
      {children}
    </div>
  );
}

/** Step 3: dashboard snippet with status, uptime strip and days-left chips (one flagged). */
export function HowDashboardVisual() {
  return (
    <VisualStage compact>
      <Panel
        icon={<span className="block h-2 w-2 bg-accent" />}
        title="Sites"
        badge={<span className="shrink-0 text-[11px] text-muted">2 monitored</span>}
        footer={
          <>
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-70 motion-safe:animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Last check · just now
            </span>
            <span className="bg-solid px-2 py-0.5 text-[11px] font-medium text-solid-fg">Recheck</span>
          </>
        }
      >
        <SiteRow name="My shop" host="shop.example.com">
          <div className="mt-2 flex h-5 gap-px">
            {Array.from({ length: BARS }, (_, i) => (
              <span
                key={i}
                className="min-w-0 flex-1 origin-bottom scale-y-0 bg-emerald-500/85 transition-transform duration-300 ease-out group-data-[inview=true]:scale-y-100 motion-reduce:transition-none dark:bg-emerald-400/80"
                style={delay(200 + i * 15)}
              />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <DaysChip label="SSL left" days={62} />
            <DaysChip label="Domain left" days={164} />
          </div>
        </SiteRow>

        <div className="mt-3 border-t border-rule pt-3">
          <SiteRow name="Client blog" host="blog.example.org">
            <div className={`mt-2 flex flex-wrap items-center gap-1.5 ${appear}`} style={delay(900)}>
              <DaysChip label="SSL left" days={21} warn />
              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
                Flagged on your dashboard
              </span>
            </div>
          </SiteRow>
        </div>
      </Panel>
    </VisualStage>
  );
}
