import { focusFix } from "@/lib/insights/focus";
import { healthFixes, type Fix, type FixKey } from "@/lib/insights/health";
import { healthInput } from "@/lib/insights/sections";
import { scoreStatus } from "@/lib/insights/status";
import type { AnalyticsPayload } from "@/components/analytics-types";
import { Cols } from "@/components/modal-ui";
import type { SiteDetails } from "./types";
import { Improve } from "./Improve";
import { Chip, Hero, Meter } from "./ui";

const CHIP =
  "shrink-0 bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25";

type Props = { data: AnalyticsPayload; details: SiteDetails | null; fix?: FixKey };

/** Score summary on the left; one selected fix (or, without `fix`, every fix) on the right. */
export function FixView({ data, details, fix }: Props) {
  const h = healthFixes(healthInput(data, details));
  const st = scoreStatus(h.score);
  const left = (
    <>
      <Hero
        label="Health score"
        value={h.score}
        unit="/100"
        chip={<Chip tone={st.tone}>{st.label}</Chip>}
        caption={h.fixes.length ? `${h.projected}/100 if every fix below is done.` : "Nothing left to fix."}
      >
        <Meter value={h.score / 100} tone={st.tone} label="Health score" />
      </Hero>
      {h.fixes.length > 0 && <Gains fixes={h.fixes} active={fix} />}
    </>
  );
  if (!fix) return <Cols left={left} right={<Improve section="health" data={data} details={details} />} />;
  const { fix: f, others } = focusFix(h.fixes, fix);
  const right = !f ? (
    <div className="border border-rule bg-surface px-4 py-4 text-sm">
      <p className="flex items-center gap-2 font-medium text-ink"><span aria-hidden className="h-2 w-2 bg-emerald-500" />Already at full marks.</p>
      <p className="mt-1 text-muted">Nothing to fix here right now.</p>
    </div>
  ) : (
    <>
      <section className="border border-rule bg-surface">
        <header className="flex items-center gap-3 border-b border-rule px-4 py-3">
          <span aria-hidden className={`h-2 w-2 shrink-0 ${f.tone === "bad" ? "bg-rose-500" : "bg-amber-500"}`} />
          <p className="min-w-0 flex-1 text-sm font-medium text-ink">What&apos;s lacking</p>
          <span className={CHIP}>+{f.gain} pts</span>
        </header>
        <p className="px-4 pt-3 text-[13px] leading-relaxed text-muted">{f.lacking}</p>
        <p className="label-caps px-4 pt-4 text-muted">How to fix</p>
        <ol className="list-decimal space-y-1.5 px-4 pb-4 pl-8 pt-2 text-[13px] leading-relaxed text-ink/90 marker:text-muted">
          {f.steps.map((s) => <li key={s}>{s}</li>)}
        </ol>
      </section>
      <p className="mt-3 text-xs text-muted">{others ? `${others} more ${others === 1 ? "fix" : "fixes"} available.` : "This is the only fix left."}</p>
    </>
  );
  return <Cols left={left} right={right} />;
}

/** Points each fix would add, with the selected one highlighted. */
function Gains({ fixes, active }: { fixes: Fix[]; active?: FixKey }) {
  return (
    <section className="border border-rule bg-surface">
      <p className="label-caps border-b border-rule px-4 py-2.5 text-muted">Points available</p>
      <ul className="divide-y divide-rule">
        {fixes.map((x) => (
          <li key={x.key} className={`flex items-center gap-3 px-4 py-2.5 text-[13px] ${x.key === active ? "bg-accent-soft" : ""}`}>
            <span aria-hidden className={`h-1.5 w-1.5 shrink-0 ${x.tone === "bad" ? "bg-rose-500" : "bg-amber-500"}`} />
            <span className={`min-w-0 flex-1 truncate ${x.key === active ? "font-medium text-ink" : "text-ink/80"}`}>{x.title}</span>
            <span className="shrink-0 tabular-nums text-muted">+{x.gain}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
