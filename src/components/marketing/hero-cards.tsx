import { IconGlobe, IconLock } from "./icons";

const card = "border border-rule bg-surface p-3.5 shadow-[6px_6px_0_0_hsl(var(--accent)/0.18)]";

function Ring({ pct, tone }: { pct: number; tone: string }) {
  return (
    <svg viewBox="0 0 36 36" className="h-10 w-10 shrink-0 -rotate-90">
      <circle cx="18" cy="18" r="15" fill="none" strokeWidth="4" className="stroke-rule" />
      <circle
        cx="18"
        cy="18"
        r="15"
        fill="none"
        strokeWidth="4"
        pathLength={100}
        strokeDasharray="100"
        strokeDashoffset={100 - pct}
        className={tone}
      />
    </svg>
  );
}

/** SSL certificate days left, drawn as a share of a 90-day certificate. */
export function SslMiniCard() {
  return (
    <div className={card}>
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted">
        <IconLock className="h-3.5 w-3.5 text-accent" /> SSL certificate
      </p>
      <div className="mt-2 flex items-center gap-3">
        <Ring pct={69} tone="stroke-accent" />
        <div className="min-w-0">
          <p className="font-display text-xl font-medium leading-none text-ink">
            62 <span className="text-sm text-muted">days left</span>
          </p>
          <p className="mt-1 truncate text-[11px] text-muted">shop.example.com</p>
        </div>
      </div>
    </div>
  );
}

/** Domain renewal timeline from today to expiry, with the 30-day warning window marked. */
export function DomainMiniCard() {
  return (
    <div className={card}>
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted">
        <IconGlobe className="h-3.5 w-3.5 text-accent" /> Domain renewal
      </p>
      <p className="mt-2 flex items-baseline justify-between gap-2">
        <span className="truncate text-[11px] text-muted">docs.example.dev</span>
        <span className="font-display text-base font-medium text-ink">41 d</span>
      </p>
      <div className="relative mt-2 h-1.5 bg-bg ring-1 ring-inset ring-rule">
        {/* 41 days to expiry; the last 30 are the warning window (starts in 11 days = 27%). */}
        <span className="absolute inset-y-0 left-0 w-[27%] bg-accent/70" />
        <span className="absolute inset-y-0 right-0 w-[73%] bg-amber-400/45 dark:bg-amber-400/30" />
        <span className="absolute -top-1 left-[27%] h-3.5 w-0.5 -translate-x-1/2 bg-ink" />
      </div>
      <p className="mt-1.5 flex justify-between text-[10px] text-muted">
        <span>Today</span>
        <span className="text-amber-800 dark:text-amber-200">30-day warning</span>
        <span>Expiry</span>
      </p>
    </div>
  );
}

export function HealthMiniCard() {
  return (
    <div className={card}>
      <p className="text-[10px] uppercase tracking-wider text-muted">Health score</p>
      <div className="mt-2 flex items-center gap-3">
        <Ring pct={100} tone="stroke-emerald-500" />
        <div className="min-w-0">
          <p className="font-display text-2xl font-medium leading-none text-ink">100</p>
          <p className="mt-1 truncate text-[11px] text-muted">shop.example.com</p>
        </div>
      </div>
    </div>
  );
}
