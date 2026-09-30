import type { CSSProperties, ReactNode } from "react";

/**
 * Transition delay relative to the step's base delay (--d). On large screens the three steps
 * are side by side, so --d staggers them; stacked on mobile, each step starts as it scrolls in.
 */
export function delay(ms: number): CSSProperties {
  return { transitionDelay: `calc(var(--d, 0ms) + ${ms}ms)` };
}

/** Appears (fades + settles) once the step is in view. */
export const appear =
  "opacity-0 transition duration-500 ease-out group-data-[inview=true]:opacity-100 motion-reduce:transition-none";

/** Numbered square on the rail; fills with the accent colour when its step is reached. */
export function StepNode({ n }: { n: string }) {
  return (
    <span
      className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center border border-rule bg-surface font-display text-sm font-medium text-accent shadow-[3px_3px_0_0_hsl(var(--accent)/0.18)] transition-colors duration-500 group-data-[inview=true]:bg-accent group-data-[inview=true]:text-white motion-reduce:transition-none"
      style={delay(0)}
    >
      {n}
    </span>
  );
}

/** Rail segment from this step's node to the next: vertical when stacked, horizontal on lg. */
export function StepRail() {
  const fill = "absolute inset-0 bg-accent transition-transform duration-700 ease-out motion-reduce:transition-none";
  return (
    <>
      <span className="absolute bottom-[-2.5rem] left-5 top-10 w-px bg-rule lg:hidden" aria-hidden>
        <span
          className={`${fill} origin-top scale-y-0 group-data-[inview=true]:scale-y-100`}
          style={delay(500)}
        />
      </span>
      <span
        className="absolute left-10 right-[-2rem] top-5 hidden h-px bg-rule lg:block"
        aria-hidden
      >
        <span
          className={`${fill} origin-left scale-x-0 group-data-[inview=true]:scale-x-100`}
          style={delay(500)}
        />
      </span>
    </>
  );
}

/** Round tick that turns green when its row passes. */
export function Tick({ at }: { at: number }) {
  return (
    <span className="relative h-5 w-5 shrink-0 rounded-full ring-1 ring-inset ring-rule">
      <span
        className="absolute inset-0 flex scale-0 items-center justify-center rounded-full bg-emerald-500 text-white transition-transform duration-300 ease-out group-data-[inview=true]:scale-100 motion-reduce:transition-none dark:bg-emerald-400 dark:text-solid"
        style={delay(at)}
      >
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M2.5 6.5l2.2 2.2 4.8-5" />
        </svg>
      </span>
    </span>
  );
}

/** Small DaysPill-style chip (same colours as the dashboard's SSL / Domain left pills). */
export function DaysChip({ label, days, warn = false }: { label: string; days: number; warn?: boolean }) {
  return (
    <span
      className={`inline-flex min-w-0 items-baseline gap-1.5 border border-rule px-2 py-1 text-[11px] ${
        warn ? "bg-amber-50 dark:bg-amber-400/10" : "bg-surface"
      }`}
    >
      <span className="truncate text-muted">{label}</span>
      <span
        className={`shrink-0 font-semibold ${warn ? "text-amber-800 dark:text-amber-200" : "text-ink"}`}
      >
        {days} days
      </span>
    </span>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-ink">{label}</p>
      <div className="mt-1 flex h-8 items-center overflow-hidden border border-rule bg-bg px-2.5 text-xs text-ink">
        {children}
      </div>
    </div>
  );
}
