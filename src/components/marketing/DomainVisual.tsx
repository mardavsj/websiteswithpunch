import { IconBell, IconGlobe } from "./icons";
import { OkPill, Panel, VisualStage, fillX, riseIn } from "./monitor-visual-parts";

/**
 * Registered 14 Mar 2026, expires 14 Mar 2027 (365 days).
 * "Today" (1 Oct 2026) is ~55% along; the 30-day alert lands at ~92%.
 */
const TODAY = "55%";
const ALERT = "91.8%";

export function DomainVisual() {
  return (
    <VisualStage>
      <div className="relative pb-6 sm:pb-4">
        <Panel
          icon={<IconGlobe className="h-4 w-4" />}
          title="Domain"
          badge={<OkPill>Registered</OkPill>}
          footer={<span>Source · RDAP / WHOIS</span>}
        >
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate font-display text-xl font-medium leading-tight text-ink sm:text-2xl">
                example.com
              </p>
              <p className="mt-1 truncate text-xs text-muted">Registrar · Namecheap</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-display text-lg font-medium leading-none text-ink">164 days</p>
              <p className="mt-1.5 text-xs text-muted">until renewal</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="relative h-4 text-[10px] text-muted">
              <span className="absolute -translate-x-1/2 font-medium text-accent" style={{ left: TODAY }}>
                Today
              </span>
              <span className="absolute -translate-x-1/2 text-amber-600 dark:text-amber-400" style={{ left: ALERT }}>
                Alert
              </span>
            </div>
            <div className="relative mt-1 h-1.5 bg-ink/10">
              <div className="absolute inset-y-0 left-0" style={{ width: TODAY }}>
                <div className={`h-full w-full bg-accent ${fillX}`} />
              </div>
              <span
                className="absolute -top-[3px] h-3 w-px bg-amber-500"
                style={{ left: ALERT }}
              />
              <span
                className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent ring-2 ring-surface"
                style={{ left: TODAY }}
              />
            </div>
            <div className="mt-2 flex justify-between gap-3 text-[10px] leading-tight">
              <span>
                <span className="block uppercase tracking-wider text-muted">Added</span>
                <span className="text-ink">14 Mar 2026</span>
              </span>
              <span className="text-right">
                <span className="block uppercase tracking-wider text-muted">Expires</span>
                <span className="text-ink">14 Mar 2027</span>
              </span>
            </div>
          </div>
        </Panel>

        <div
          className={`absolute bottom-0 right-3 flex items-center gap-2 bg-solid px-3 py-2 text-xs text-solid-fg shadow-[4px_4px_0_0_hsl(var(--accent)/0.35)] delay-700 sm:-right-4 ${riseIn}`}
        >
          <IconBell className="h-3.5 w-3.5 shrink-0 text-accent" />
          <span className="whitespace-nowrap">Alert sent 30 days before</span>
        </div>
      </div>
    </VisualStage>
  );
}
