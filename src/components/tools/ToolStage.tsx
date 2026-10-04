import type { ReactNode } from "react";

/** Dotted stage with a product-style panel (square corners, rule border, flat blue offset shadow). */
export function ToolStage({
  icon,
  title,
  badge,
  children,
  className = "",
}: {
  icon: ReactNode;
  title: string;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative border border-rule bg-bg p-3 pb-5 pr-5 sm:p-8 sm:pb-10 sm:pr-10 ${className}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(hsl(var(--ink)/0.09)_1px,transparent_1px)] [background-size:14px_14px]"
      />
      <div className="relative border border-rule bg-surface shadow-[8px_8px_0_0_hsl(var(--accent)/0.18)]">
        <div className="flex items-center justify-between gap-3 border-b border-rule px-4 py-2.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-accent">{icon}</span>
            <span className="truncate font-display text-sm font-medium text-ink">{title}</span>
          </div>
          {badge}
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

/** Small neutral chip for panel headers ("Free · no signup"). */
export function StageChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent-hover ring-1 ring-inset ring-accent/25 dark:text-accent">
      {children}
    </span>
  );
}
