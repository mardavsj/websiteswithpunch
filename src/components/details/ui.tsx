import type { ReactNode } from "react";
import { IconInfo } from "./icons";

/** Colour carries state only: green fine, amber soon, red act now, neutral otherwise. */
export type Tone = "ok" | "warn" | "bad" | "neutral" | "accent";

const CHIP: Record<Tone, string> = {
  ok: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25",
  warn: "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/25",
  bad: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/25",
  neutral: "bg-ink/[0.04] text-muted ring-rule",
  accent: "bg-accent-soft text-accent ring-accent/25",
};
const DOT: Record<Tone, string> = { ok: "bg-emerald-500", warn: "bg-amber-500", bad: "bg-rose-500", neutral: "bg-muted", accent: "bg-accent" };
export const BAR: Record<Tone, string> = { ok: "bg-emerald-500", warn: "bg-amber-500", bad: "bg-rose-500", neutral: "bg-muted/60", accent: "bg-accent" };

/** Days until an expiry → tone (≤14 red, ≤30 amber). */
export function daysTone(n: number | null | undefined): Tone {
  if (n == null) return "neutral";
  return n <= 14 ? "bad" : n <= 30 ? "warn" : "ok";
}

export function Chip({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${CHIP[tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[tone]}`} />
      {children}
    </span>
  );
}

const card = "border border-rule bg-surface shadow-[0_1px_2px_0_hsl(var(--ink)/0.05)]";

/** Section card: icon + small caps title (+ meta on the right), then content. */
export function Card({ title, icon, meta, note, children }: { title: string; icon?: ReactNode; meta?: ReactNode; note?: ReactNode; children: ReactNode }) {
  return (
    <section className={`mt-3 first:mt-0 ${card}`}>
      <header className="flex items-center gap-2 border-b border-rule px-4 py-2.5">
        {icon && <span className="text-muted">{icon}</span>}
        <h3 className="label-caps min-w-0 flex-1 !text-ink/80">{title}</h3>
        {meta && <span className="shrink-0 text-xs tabular-nums text-muted">{meta}</span>}
      </header>
      {note && <p className="border-b border-rule px-4 py-2 text-xs leading-relaxed text-muted">{note}</p>}
      {children}
    </section>
  );
}

/** The one number that matters for this panel, big, with a status chip and an optional visual. */
export function Hero({ label, value, unit, chip, caption, children, compact = false }: { label: string; value: ReactNode; unit?: string; chip?: ReactNode; caption?: ReactNode; children?: ReactNode; compact?: boolean }) {
  return (
    <section className={`mb-3 px-4 py-4 ${card}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="label-caps">{label}</p>
        {chip}
      </div>
      <p className="mt-1.5 flex items-baseline gap-1.5 font-display text-ink">
        <span className={`${compact ? "text-xl" : "text-3xl"} font-medium tabular-nums tracking-tight`}>{value}</span>
        {unit && <span className="text-sm text-muted">{unit}</span>}
      </p>
      {caption && <p className="mt-1 text-xs leading-relaxed text-muted">{caption}</p>}
      {children && <div className="mt-3">{children}</div>}
    </section>
  );
}

/** Thin horizontal bar, value 0..1. */
export function Meter({ value, tone = "accent", label }: { value: number; tone?: Tone; label?: string }) {
  const w = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="h-1.5 w-full bg-ink/[0.07]" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(w)} aria-label={label}>
      <div className={`h-full ${BAR[tone]}`} style={{ width: `${w}%` }} />
    </div>
  );
}

/** Start → end bar with a "today" marker; real dates only. */
export function Lifespan({ start, end, startLabel, endLabel, tone }: { start: string; end: string; startLabel: string; endLabel: string; tone: Tone }) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const used = e > s ? (Date.now() - s) / (e - s) : 1;
  return (
    <div>
      <Meter value={used} tone={tone} label="Share of the validity period already used" />
      <div className="mt-1.5 flex justify-between gap-3 text-[11px] text-muted">
        <span>{startLabel}</span>
        <span className="text-right">{endLabel}</span>
      </div>
    </div>
  );
}

/** Small stat tiles separated by hairlines. */
export function Stats({ items }: { items: Array<{ label: string; value: ReactNode; tone?: Tone }> }) {
  const cols = items.length >= 4 ? "grid-cols-2 sm:grid-cols-4" : items.length === 3 ? "grid-cols-3" : "grid-cols-2";
  return (
    <div className={`mb-3 grid gap-px bg-rule p-px shadow-[0_1px_2px_0_hsl(var(--ink)/0.05)] ${cols}`}>
      {items.map((s) => (
        <div key={s.label} className="bg-surface px-3 py-2.5">
          <p className="text-[11px] text-muted">{s.label}</p>
          <p className={`mt-0.5 font-display text-lg font-medium tabular-nums ${s.tone === "bad" ? "text-danger" : "text-ink"}`}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}

/** Empty state inside a card: icon, short title, the reason. */
export function Empty({ title, reason, icon }: { title: string; reason?: string; icon?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 px-4 py-4">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center bg-ink/[0.04] text-muted">{icon ?? <IconInfo />}</span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{title}</p>
        {reason && <p className="mt-0.5 text-xs leading-relaxed text-muted">{reason}</p>}
      </div>
    </div>
  );
}

/** Wrapping tags (names, nameservers). */
export function Tags({ items, mono = false }: { items: string[]; mono?: boolean }) {
  return (
    <ul className="flex flex-wrap gap-1.5 px-4 py-3">
      {items.map((t) => (
        <li key={t} className={`max-w-full break-all border border-rule bg-bg px-2 py-1 text-xs text-ink ${mono ? "font-mono" : ""}`}>{t}</li>
      ))}
    </ul>
  );
}
