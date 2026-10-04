import type { ReactNode } from "react";

/** Compact dotted stage for the hub's tool previews (static, no client JS). */
export function MiniStage({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-[220px] lg:h-[300px] items-center justify-center overflow-hidden border-b border-rule bg-bg px-4 py-7 sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(hsl(var(--ink)/0.09)_1px,transparent_1px)] [background-size:14px_14px]"
      />
      <div className="relative w-full max-w-[340px]" aria-hidden>
        {children}
      </div>
    </div>
  );
}

/** Product-style mini window used inside each preview. */
export function MiniPanel({ title, tag, children }: { title: string; tag: ReactNode; children: ReactNode }) {
  return (
    <div className="border border-rule bg-surface shadow-[6px_6px_0_0_hsl(var(--accent)/0.18)]">
      <div className="flex items-center justify-between gap-2 border-b border-rule px-3.5 py-2">
        <span className="truncate font-mono text-[11px] text-muted">{title}</span>
        {tag}
      </div>
      <div className="p-3.5">{children}</div>
    </div>
  );
}

/** Marks every preview as sample data, so nothing reads as a live status. */
export const okTag = (
  <span className="shrink-0 border border-rule px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted">
    Example
  </span>
);
