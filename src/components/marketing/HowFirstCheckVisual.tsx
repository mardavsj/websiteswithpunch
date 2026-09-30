import { IconPulse } from "./icons";
import { Tick, appear, delay } from "./how-parts";
import { OkPill, Panel, VisualStage } from "./monitor-visual-parts";

const ROWS = [
  { label: "Reachable", detail: "200 · 142 ms", at: 400 },
  { label: "SSL valid", detail: "62 days", at: 850 },
  { label: "Domain registered", detail: "164 days", at: 1300 },
];

/** Step 2: the first check ticking through uptime, SSL and domain, then the health score. */
export function HowFirstCheckVisual() {
  return (
    <VisualStage compact>
      <Panel
        icon={<IconPulse className="h-4 w-4" />}
        title="shop.example.com"
        badge={
          <span className="relative shrink-0">
            <span
              className="inline-flex items-center gap-1.5 bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-muted ring-1 ring-inset ring-rule transition-opacity duration-300 absolute right-0 top-0 whitespace-nowrap group-data-[inview=true]:opacity-0 motion-reduce:transition-none"
              style={delay(1500)}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-muted" />
              Checking
            </span>
            <span className={`block ${appear}`} style={delay(1600)}>
              <OkPill>Up</OkPill>
            </span>
          </span>
        }
        footer={
          <>
            <span className="label-caps">Health score</span>
            <span
              className={`bg-emerald-50 px-2 py-0.5 font-display text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-400/15 dark:text-emerald-300 dark:ring-emerald-400/30 ${appear}`}
              style={delay(1800)}
            >
              100
            </span>
          </>
        }
      >
        <ul className="-my-2">
          {ROWS.map((r) => (
            <li
              key={r.label}
              className="flex items-center gap-3 border-b border-rule py-2.5 last:border-b-0"
            >
              <Tick at={r.at} />
              <span className="min-w-0 flex-1 truncate text-xs text-ink">{r.label}</span>
              <span className={`shrink-0 text-xs text-muted ${appear}`} style={delay(r.at + 100)}>
                {r.detail}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </VisualStage>
  );
}
