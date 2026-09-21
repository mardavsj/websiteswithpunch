type DashboardMockProps = {
  className?: string;
  /** Slightly denser chrome for hero / overlapping layers */
  dense?: boolean;
};

export function DashboardMock({ className = "", dense = false }: DashboardMockProps) {
  return (
    <div
      className={`overflow-hidden rounded-none border border-rule bg-bg shadow-[8px_8px_0_0_hsl(var(--ink)/0.08)] ${className}`}
      aria-hidden
    >
      <div
        className={`flex items-center justify-between border-b border-rule ${dense ? "px-4 py-2.5" : "px-5 py-3"}`}
      >
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 bg-accent" />
          <span className="font-display text-sm font-medium text-ink">Sites</span>
        </div>
        <span className="label-caps text-muted">example.com</span>
      </div>
      <div className="grid gap-0 sm:grid-cols-3">
        <div className={`border-b border-rule sm:border-b-0 sm:border-r ${dense ? "p-4" : "p-5"}`}>
          <p className="label-caps text-muted">Status</p>
          <p className={`mt-2 font-display font-medium text-ink ${dense ? "text-xl" : "text-2xl"}`}>
            <span className="mr-1.5 inline-block h-2.5 w-2.5 bg-accent align-middle" />
            UP
          </p>
          <p className="mt-1 text-xs text-muted">Last check · 142 ms</p>
        </div>
        <div className={`border-b border-rule sm:border-b-0 sm:border-r ${dense ? "p-4" : "p-5"}`}>
          <p className="label-caps text-muted">SSL</p>
          <p className={`mt-2 font-display font-medium text-ink ${dense ? "text-xl" : "text-2xl"}`}>
            84 days
          </p>
          <p className="mt-1 text-xs text-muted">Certificate expires · OK</p>
        </div>
        <div className={dense ? "p-4" : "p-5"}>
          <p className="label-caps text-muted">Domain</p>
          <p className={`mt-2 font-display font-medium text-ink ${dense ? "text-xl" : "text-2xl"}`}>
            210 days
          </p>
          <p className="mt-1 text-xs text-muted">Renewal window · OK</p>
        </div>
      </div>
      <div className="border-t border-rule px-5 py-3 text-xs text-muted">Health Score: 100</div>
    </div>
  );
}
