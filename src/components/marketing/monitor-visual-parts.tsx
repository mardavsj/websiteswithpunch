import type { ReactNode } from "react";
import { InView } from "./InView";

/** Horizontal fill that grows from the left once the stage is in view. */
export const fillX =
  "origin-left scale-x-0 transition-transform duration-1000 ease-out group-data-[inview=true]:scale-x-100 motion-reduce:transition-none";

/** Soft rise-in used for floating chips. */
export const riseIn =
  "translate-y-2 opacity-0 transition duration-700 ease-out group-data-[inview=true]:translate-y-0 group-data-[inview=true]:opacity-100 motion-reduce:transition-none";

/** Dotted stage the product vignette sits on. `compact` is the tighter How-it-works size. */
export function VisualStage({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  const size = compact
    ? "px-3 py-6 sm:px-6 sm:py-8"
    : "min-h-[220px] px-4 py-8 sm:min-h-[280px] sm:px-8 sm:py-10";
  return (
    <InView className={`relative flex h-full w-full items-center justify-center overflow-hidden border border-rule bg-bg ${size}`}>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(hsl(var(--ink)/0.09)_1px,transparent_1px)] [background-size:14px_14px]"
        aria-hidden
      />
      <div className="relative w-full max-w-[420px]" aria-hidden>
        {children}
      </div>
    </InView>
  );
}

type PanelProps = {
  icon: ReactNode;
  title: string;
  badge?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

/** Product-style window: square corners, rule borders, hard accent shadow. */
export function Panel({ icon, title, badge, footer, children }: PanelProps) {
  return (
    <div className="border border-rule bg-surface shadow-[8px_8px_0_0_hsl(var(--accent)/0.18)]">
      <div className="flex items-center justify-between gap-3 border-b border-rule px-4 py-2.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-accent">{icon}</span>
          <span className="truncate font-display text-sm font-medium text-ink">{title}</span>
        </div>
        {badge}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
      {footer ? (
        <div className="flex items-center justify-between gap-3 border-t border-rule px-4 py-2.5 text-[11px] text-muted sm:px-5">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

/** Status pill matching StatusBadge's "up" styling, optionally with a live pulse. */
export function OkPill({ children, live = false }: { children: ReactNode; live?: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-400/15 dark:text-emerald-300 dark:ring-emerald-400/30">
      <span className="relative flex h-1.5 w-1.5">
        {live ? (
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-70 motion-safe:animate-ping" />
        ) : null}
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      {children}
    </span>
  );
}

/** Small blue accent chip. */
export function AccentChip({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent-hover dark:text-accent ring-1 ring-inset ring-accent/25">
      {icon}
      {children}
    </span>
  );
}
