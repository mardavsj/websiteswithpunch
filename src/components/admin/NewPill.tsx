/** Green count of unseen items. Renders nothing at 0; caps at 99+. */
export function NewPill({ n, className = "" }: { n: number; className?: string }) {
  if (n <= 0) return null;
  return (
    <span aria-label={`${n} new`} className={`ml-auto inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-none bg-emerald-700 px-1.5 text-[11px] font-semibold leading-none tabular-nums text-white ${className}`}>
      {n > 99 ? "99+" : n}
    </span>
  );
}

/** Small green dot marking a row that's new since the last visit. */
export function NewDot({ on }: { on: boolean }) {
  return on ? <span title="New" aria-label="New" className="mr-1.5 inline-block h-2 w-2 shrink-0 rounded-none bg-emerald-700 align-middle dark:bg-emerald-500" /> : null;
}
