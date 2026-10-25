import { sectionInsight } from "@/lib/insights/sections";
import type { AnalyticsPayload } from "@/components/analytics-types";
import type { DetailsSection, SiteDetails } from "./types";
import { Card } from "./ui";
import { IconGauge } from "./icons";

const SQ = { warn: "bg-amber-500", bad: "bg-rose-500" } as const;

/** "How to improve" card at the foot of every Details panel: what's lacking and how to fix it. */
export function Improve({ section, data, details }: { section: DetailsSection; data: AnalyticsPayload; details: SiteDetails | null }) {
  const ins = sectionInsight(section, data, details);
  const health = section === "health";
  const title = health ? (ins.state === "great" ? "Perfect score" : "How to reach 100") : "How to improve";
  if (ins.state !== "improve") {
    const ok = ins.state === "great";
    return (
      <Card title={title} icon={<IconGauge />}>
        <div className="flex gap-3 px-4 py-3 text-[13px]">
          <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 ${ok ? "bg-emerald-500" : "bg-muted/60"}`} />
          <p className="leading-relaxed text-muted">
            <span className="font-medium text-ink">{ok ? (health ? "Perfect score. Keep it up." : "Looks great.") : "Not enough data yet."}</span> {ins.note}
          </p>
        </div>
      </Card>
    );
  }
  return (
    <Card title={title} icon={<IconGauge />} meta={health ? `${ins.items.length} to fix` : undefined} note={ins.note || undefined}>
      <ul className="divide-y divide-rule">
        {ins.items.map((t, i) => (
          <li key={t.title}>
            <details open={i === 0} className="group">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-2.5 text-[13px] hover:bg-accent-soft/50 [&::-webkit-details-marker]:hidden">
                <span aria-hidden className={`h-2 w-2 shrink-0 ${SQ[t.tone]}`} />
                <span className="min-w-0 flex-1 font-medium text-ink">{t.title}</span>
                {t.gain != null && (
                  <span className="shrink-0 bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25">
                    +{t.gain} pts
                  </span>
                )}
                <span aria-hidden className="shrink-0 text-muted transition-transform group-open:rotate-90">›</span>
              </summary>
              <div className="px-4 pb-3 pl-9 text-[13px]">
                <p className="text-muted">{t.lacking}</p>
                <ol className="mt-2 list-decimal space-y-1 pl-4 leading-relaxed text-ink/90 marker:text-muted">
                  {t.steps.map((s) => <li key={s}>{s}</li>)}
                </ol>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </Card>
  );
}
