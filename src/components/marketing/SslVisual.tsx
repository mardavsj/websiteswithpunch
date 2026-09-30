import { IconLock } from "./icons";
import { AccentChip, OkPill, Panel, VisualStage } from "./monitor-visual-parts";

/** 62 of a 90-day certificate lifetime left → marker sits (90 - 62) / 90 along the bar. */
const MARKER_LEFT = "31%";

const ROWS: [string, string][] = [
  ["Domain", "shop.example.com"],
  ["Issuer", "Let's Encrypt"],
  ["Expires", "2 Dec 2026"],
];

export function SslVisual() {
  return (
    <VisualStage>
      <Panel
        icon={<IconLock className="h-4 w-4" />}
        title="TLS certificate"
        badge={<OkPill>Valid</OkPill>}
        footer={
          <>
            <span>Read on every check</span>
            <AccentChip>Renews in 32 days</AccentChip>
          </>
        }
      >
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="relative h-20 w-20 shrink-0 sm:h-28 sm:w-28">
            <svg viewBox="0 0 96 96" className="h-full w-full -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                strokeWidth="8"
                className="stroke-ink/10"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                strokeWidth="8"
                pathLength={1}
                strokeDasharray="1"
                className="stroke-emerald-500 transition-[stroke-dashoffset] duration-[1200ms] ease-out [stroke-dashoffset:1] group-data-[inview=true]:[stroke-dashoffset:0.311] motion-reduce:transition-none dark:stroke-emerald-400"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-xl font-medium leading-none text-ink sm:text-3xl">
                62
              </span>
              <span className="mt-1 text-[9px] uppercase tracking-wider text-muted sm:text-[10px]">days left</span>
            </div>
          </div>

          <dl className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-xs">
            {ROWS.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted">{k}</dt>
                <dd className="truncate text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            Valid · 62 days left
          </p>
          <div className="relative">
            <div className="flex h-1.5 w-full overflow-hidden">
              <span className="w-[66.7%] bg-emerald-500/80 dark:bg-emerald-400/70" />
              <span className="w-[17.8%] bg-amber-400/90" />
              <span className="flex-1 bg-rose-500/80" />
            </div>
            <span
              className="absolute -top-1 h-3.5 w-0.5 -translate-x-1/2 bg-ink"
              style={{ left: MARKER_LEFT }}
            />
          </div>
          <div className="relative mt-1.5 h-3 text-[10px] text-muted">
            <span className="absolute left-0">90 d</span>
            <span className="absolute left-[66.7%] -translate-x-1/2">30 d</span>
            <span className="absolute left-[84.5%] -translate-x-1/2">14 d</span>
            <span className="absolute right-0">0</span>
          </div>
        </div>
      </Panel>
    </VisualStage>
  );
}
