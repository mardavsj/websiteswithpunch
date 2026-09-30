import { IconPulse } from "./icons";
import { OkPill, Panel, VisualStage } from "./monitor-visual-parts";

const DAYS = 60;
/** Day index → incident tone; everything else is a clean day. */
const INCIDENTS: Record<number, "warn" | "down"> = { 21: "warn", 46: "down" };

const LATENCY = [
  138, 142, 136, 150, 144, 139, 141, 158, 148, 142, 137, 135, 146, 152, 149, 141, 138, 204, 171,
  150, 143, 140, 139, 145, 151, 147, 142, 138, 136, 144, 149, 143, 140, 137, 141, 146, 143, 139,
  142, 140,
];

function sparkPath(values: number[], w: number, h: number) {
  const min = 120;
  const max = 215;
  const step = w / (values.length - 1);
  return values
    .map((v, i) => {
      const y = h - ((v - min) / (max - min)) * h;
      return `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

const W = 240;
const H = 44;
const LINE = sparkPath(LATENCY, W, H);
const AREA = `${LINE} L${W} ${H} L0 ${H} Z`;

function barTone(i: number) {
  const t = INCIDENTS[i];
  if (t === "down") return "bg-rose-500";
  if (t === "warn") return "bg-amber-400";
  return "bg-emerald-500/85 dark:bg-emerald-400/80";
}

export function UptimeVisual() {
  return (
    <VisualStage>
      <Panel
        icon={<IconPulse className="h-4 w-4" />}
        title="shop.example.com"
        badge={<OkPill live>Operational</OkPill>}
        footer={
          <>
            <span>2 incidents · 17 min total</span>
            <span className="hidden min-[400px]:inline">Last check · just now</span>
          </>
        }
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-display text-3xl font-medium leading-none text-ink sm:text-4xl">
              99.98%
            </p>
            <p className="mt-1.5 text-xs text-muted">uptime · last 60 days</p>
          </div>
          <div className="text-right">
            <p className="font-display text-lg font-medium leading-none text-ink">142 ms</p>
            <p className="mt-1.5 text-xs text-muted">avg response</p>
          </div>
        </div>

        <div className="mt-4 flex h-8 items-stretch gap-px sm:gap-[2px]">
          {Array.from({ length: DAYS }, (_, i) => (
            <span
              key={i}
              className={`min-w-0 flex-1 origin-bottom scale-y-0 transition-transform duration-500 ease-out group-data-[inview=true]:scale-y-100 motion-reduce:transition-none ${barTone(i)}`}
              style={{ transitionDelay: `${i * 10}ms` }}
            />
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-muted">
          <span>60 days ago</span>
          <span>Today</span>
        </div>

        <div className="mt-4 border-t border-rule pt-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="label-caps">Response time</span>
            <span className="text-muted">last 24 h</span>
          </div>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="mt-2 h-auto w-full overflow-visible text-accent"
          >
            <path
              d={AREA}
              className="fill-current opacity-0 transition-opacity delay-500 duration-700 group-data-[inview=true]:opacity-10 motion-reduce:transition-none"
            />
            <path
              d={LINE}
              pathLength={1}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinejoin="round"
              strokeDasharray="1"
              className="transition-[stroke-dashoffset] duration-[1400ms] ease-out [stroke-dashoffset:1] group-data-[inview=true]:[stroke-dashoffset:0] motion-reduce:transition-none"
            />
          </svg>
        </div>
      </Panel>
    </VisualStage>
  );
}
