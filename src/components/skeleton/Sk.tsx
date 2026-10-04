import type { ReactNode } from "react";

/**
 * Skeleton building blocks. Each one renders an invisible stand-in (sample text or the real
 * button label) inside the real element's classes, so bars and blocks match the loaded page's
 * line heights, padding and wrapping exactly and nothing shifts when content swaps in.
 */

/** Grey bar the size of the given text. Put it inside an element carrying the real text classes. */
export function Sk({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`sk ${className}`}>{children}</span>;
}

/** Button-shaped block. `className` = the real button's padding/size classes. */
export function SkBtn({
  children,
  className,
  outline = false,
}: {
  children: ReactNode;
  className: string;
  outline?: boolean;
}) {
  return (
    <span
      className={`sk inline-block rounded-none whitespace-nowrap ${
        outline ? "border border-rule" : ""
      } ${className}`}
    >
      {children}
    </span>
  );
}

/** Ring-shaped placeholder at a gauge's real size and stroke width. */
export function SkRing({ size, r, stroke }: { size: number; r: number; stroke: number }) {
  const c = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" aria-hidden>
      <circle cx={c} cy={c} r={r} fill="none" strokeWidth={stroke} className="sk-ring" />
    </svg>
  );
}

/** Screen-reader status for a loading region. */
export function SkStatus({ label = "Loading…" }: { label?: string }) {
  return <span className="sr-only">{label}</span>;
}

/** Bordered surface card, as used across the app. */
export function SkCard({ children, className = "p-4" }: { children: ReactNode; className?: string }) {
  return <div className={`border border-rule bg-surface ${className}`}>{children}</div>;
}

/** Form input frame (border, padding, line height) with a placeholder-width bar inside. */
export function SkInput({ children, className = "mt-1" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`w-full border border-rule bg-bg px-3 py-2 text-sm ${className}`}>
      <Sk>{children}</Sk>
    </div>
  );
}

/** Centred full-height frame used by the plan and profile pages. */
export const FULL_FRAME =
  "mx-auto flex w-full max-w-6xl flex-1 items-center [align-items:safe_center] px-4 py-10 sm:px-6";
