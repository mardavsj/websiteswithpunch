import Image from "next/image";
import { ReplicaSiteCard } from "./ReplicaSiteCard";
import { previewSites, previewUser as u } from "./preview-data";

/** Browser window chrome around the replica. */
function WindowBar() {
  return (
    <div className="flex items-center gap-3 border-b border-rule bg-surface px-3 py-2.5 sm:px-4 lg:py-2">
      <div className="flex shrink-0 gap-1.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-2.5 w-2.5 rounded-full border border-rule bg-bg" />
        ))}
      </div>
      <div className="mx-auto flex min-w-0 max-w-sm flex-1 items-center justify-center gap-1.5 border border-rule bg-bg px-3 py-1 text-xs text-muted lg:py-0.5">
        <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="5" y="11" width="14" height="10" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
        <span className="truncate">websiteswithpunch.com/dashboard</span>
      </div>
      <span className="hidden w-[42px] shrink-0 sm:block" aria-hidden />
    </div>
  );
}

/** Signed-in navbar, copied from Navbar + NavUpgradeButtons (Pro plan) + ThemeToggle + ProfileMenu. */
function ReplicaNav() {
  return (
    <div className="border-b border-rule bg-bg/90">
      <div className="mx-auto flex max-w-6xl min-w-0 items-center justify-between gap-2 px-4 py-4 sm:px-6">
        <span className="flex min-w-0 items-center gap-2 font-display text-sm font-medium text-ink sm:gap-2.5 sm:text-base">
          <Image src="/logo.svg" alt="" width={32} height={32} unoptimized className="h-7 w-7 shrink-0 object-contain md:h-8 md:w-8" />
          <span className="truncate">Websites With Punch</span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-sm">
          <span className="hidden items-center gap-2 md:flex">
            <span className="rounded-none bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover">
              Upgrade to Business
            </span>
          </span>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-none border border-rule text-ink hover:bg-accent-soft">
            <svg viewBox="0 0 24 24" className="hidden h-4 w-4 dark:block" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
            <svg viewBox="0 0 24 24" className="h-4 w-4 dark:hidden" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5z" />
            </svg>
          </span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-rule bg-accent-soft text-sm font-medium text-ink hover:bg-bg">
            {u.initial}
          </span>
        </span>
      </div>
    </div>
  );
}

const box = "border border-rule bg-surface p-4";
/** lg+: the whole window is shown (no fade). Cards 1-3, or 1-2 when FitWindow sets .fit-2 on short screens. */
const lgCards = ["", "", "lg:[.fit-2_&]:hidden"];

/** Static, inert replica of /dashboard with example data (same classes as the real page). */
export function DashboardReplica() {
  const down = previewSites.filter((s) => s.status === "down").length;
  const sslSoon = Math.min(...previewSites.map((s) => s.sslDays));
  return (
    <div
      data-preview-frame
      role="img"
      aria-label={`Dashboard preview with example data: ${previewSites.length} sites, each showing status, SSL days left and domain days left.`}
      className="relative border border-rule bg-bg shadow-[10px_10px_0_0_hsl(var(--accent)/0.14)]"
    >
      <WindowBar />
      <div className="pointer-events-none max-h-[1060px] select-none overflow-hidden [mask-image:linear-gradient(black_calc(100%_-_96px),transparent)] sm:max-h-[780px] lg:max-h-none lg:[mask-image:none]">
        <ReplicaNav />
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-display text-2xl font-medium text-ink">Welcome, {u.name}</p>
              <p className="mt-1 text-sm text-muted">
                Current plan: <span className="font-medium text-ink">{u.plan}</span> · {previewSites.length}/{u.limit} active
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-none bg-solid px-4 py-2 text-sm font-medium text-solid-fg hover:opacity-90">Add site</span>
              <span className="rounded-none border border-rule bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-accent-soft">
                Buy +{u.packSites} site slots
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className={box}>
              <p className="label-caps text-muted">Sites monitored</p>
              <p className="mt-1 font-display text-2xl font-medium text-ink">{previewSites.length}</p>
            </div>
            <div className={box}>
              <p className="label-caps text-muted">Down / error now</p>
              <p className={`mt-1 font-display text-2xl font-medium ${down > 0 ? "text-rose-700 dark:text-rose-300" : "text-ink"}`}>{down}</p>
            </div>
            <div className={box}>
              <p className="label-caps text-muted">Nearest SSL expiry</p>
              <p className="mt-1 font-display text-2xl font-medium text-ink">{sslSoon}d</p>
            </div>
          </div>

          <div className="mt-8 space-y-5">
            {previewSites.map((s, i) => (
              <ReplicaSiteCard key={s.url} site={s} callouts={i === 0} className={lgCards[i] ?? "lg:hidden"} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
