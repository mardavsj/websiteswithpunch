"use client";

import { TOUR, clock } from "./tour-content";

/** Large centered play / pause / replay — the cue that this is a video. */
export function CenterControl({ kind }: { kind: "play" | "pause" | "replay" }) {
  const label = kind === "pause" ? "Pause" : kind === "replay" ? "Watch again" : "Play tour";
  return (
    <span className="relative flex flex-col items-center gap-3">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white shadow-[0_10px_28px_hsl(var(--accent)/0.4)] ring-[6px] ring-white/85 transition-transform duration-200 group-hover:scale-105 group-focus-visible:scale-105 dark:ring-black/35 sm:h-20 sm:w-20 sm:ring-8">
        {kind === "pause" ? (
          <svg viewBox="0 0 24 24" className="h-8 w-8 sm:h-10 sm:w-10" fill="currentColor" aria-hidden>
            <path d="M7 5h3.5v14H7zm6.5 0H17v14h-3.5z" />
          </svg>
        ) : kind === "replay" ? (
          <svg viewBox="0 0 24 24" className="h-8 w-8 sm:h-10 sm:w-10" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
            <path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v4.5h4.5" strokeLinecap="square" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="ml-1 h-8 w-8 sm:h-10 sm:w-10" fill="currentColor" aria-hidden>
            <path d="M7 4.2v15.6L20.2 12z" />
          </svg>
        )}
      </span>
      <span className="rounded-full border border-rule bg-surface/95 px-3 py-1 text-xs font-medium text-ink shadow-sm backdrop-blur-sm sm:text-sm">
        {label}
        {kind === "play" ? <span className="text-muted"> · {clock(TOUR.seconds)}</span> : null}
      </span>
    </span>
  );
}
