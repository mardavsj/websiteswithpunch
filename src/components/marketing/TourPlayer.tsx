"use client";

import { useRef, useState } from "react";
import { TOUR, TOUR_CHAPTERS, clock } from "./tour-content";

const panel = "border border-rule bg-surface";
const shadow = "shadow-[8px_8px_0_0_hsl(var(--accent)/0.18)]";

/** Flat play/replay badge: accent square + label panel, lifted on hover and focus. */
function PlayBadge({ title, sub, replay }: { title: string; sub: string; replay?: boolean }) {
  return (
    <span className="relative flex items-stretch border border-rule bg-surface shadow-[6px_6px_0_0_hsl(var(--accent)/0.35)] transition-transform duration-200 group-hover:-translate-y-0.5 group-focus-visible:-translate-y-0.5 group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-focus-visible:outline-accent motion-reduce:transition-none">
      <span className="flex w-11 items-center justify-center bg-accent text-white sm:w-16">
        {replay ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
            <path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v4.5h4.5" strokeLinecap="square" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5 sm:h-7 sm:w-7" fill="currentColor" aria-hidden>
            <path d="M7 4.5v15l12.5-7.5z" />
          </svg>
        )}
      </span>
      <span className="flex flex-col justify-center px-3 py-1.5 text-left sm:px-5 sm:py-3">
        <span className="font-display text-sm font-medium text-ink sm:text-base">{title}</span>
        <span className="mt-0.5 hidden text-xs text-muted sm:block">{sub}</span>
      </span>
    </span>
  );
}

/**
 * The homepage product tour. Nothing is fetched until the visitor presses play (preload="none",
 * lazy poster image); then it plays with sound and native controls take over (keyboard, captions,
 * fullscreen). Phones get the 720p file; desktops get AV1 WebM where supported, else 1080p H.264.
 */
export function TourPlayer() {
  const ref = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [active, setActive] = useState(-1);

  const play = (t?: number) => {
    const v = ref.current;
    if (!v) return;
    if (t !== undefined) v.currentTime = t;
    setStarted(true);
    setEnded(false);
    v.play().catch(() => undefined);
    v.focus({ preventScroll: true });
  };

  const onTime = () => {
    const now = ref.current?.currentTime ?? 0;
    let i = -1;
    TOUR_CHAPTERS.forEach((c, n) => {
      if (now >= c.t) i = n;
    });
    setActive(i);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-8">
      <div className={`${panel} ${shadow} min-w-0`}>
        <div className="flex items-center gap-3 border-b border-rule px-3 py-2.5 sm:px-4">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2 w-2 bg-accent" />
            <span className="h-2 w-2 bg-rule" />
            <span className="h-2 w-2 bg-rule" />
          </span>
          <span className="truncate font-display text-sm font-medium text-ink">
            <span className="hidden sm:inline">Website Health · </span>Product tour
          </span>
          <span className="ml-auto shrink-0 text-[11px] tabular-nums text-muted">{clock(TOUR.seconds)}</span>
        </div>
        <div className="relative aspect-video bg-[#f3f3f1]">
          <video
            ref={ref}
            className="absolute inset-0 h-full w-full focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
            preload="none"
            playsInline
            controls={started}
            tabIndex={started ? 0 : -1}
            aria-label={`${TOUR.name}. ${TOUR.description}`}
            onPlay={() => setStarted(true)}
            onTimeUpdate={onTime}
            onEnded={() => setEnded(true)}
          >
            <source src={TOUR.mp4Small} type="video/mp4" media="(max-width: 767px)" />
            <source src={TOUR.webm} type='video/webm; codecs="av01.0.08M.08, opus"' />
            <source src={TOUR.mp4} type="video/mp4" />
            <track kind="captions" src={TOUR.captions} srcLang="en" label="English" />
          </video>
          {!started || ended ? (
            <button
              type="button"
              onClick={() => play(ended ? 0 : undefined)}
              className="group absolute inset-0 flex items-end justify-end p-2.5 focus:outline-none sm:p-6"
            >
              {ended ? (
                <span className="absolute inset-0 bg-bg/70 backdrop-blur-[2px]" aria-hidden />
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized static WebP, lazy below the fold */}
                  <img
                    src={TOUR.poster}
                    srcSet={`${TOUR.posterSmall} 640w, ${TOUR.poster} 1280w`}
                    sizes="(min-width: 1152px) 830px, (min-width: 1024px) 70vw, 94vw"
                    width={1280}
                    height={720}
                    loading="lazy"
                    decoding="async"
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <span className="absolute inset-0 bg-ink/[0.08] transition-colors group-hover:bg-ink/[0.03] dark:bg-black/25" aria-hidden />
                </>
              )}
              <PlayBadge
                replay={ended}
                title={ended ? "Watch again" : `Watch the ${TOUR.seconds}-second tour`}
                sub={ended ? "From the start" : `Sound on · ${clock(TOUR.seconds)}`}
              />
            </button>
          ) : null}
        </div>
      </div>

      <nav aria-label="Tour chapters" className={`${panel} self-start`}>
        <p className="border-b border-rule px-4 py-2.5 font-display text-sm font-medium text-ink">Chapters</p>
        <ol className="grid grid-cols-2 gap-px bg-rule sm:grid-cols-4 lg:grid-cols-1">
          {TOUR_CHAPTERS.map((c, i) => {
            const on = i === active;
            return (
              <li key={c.t} className="bg-surface">
                <button
                  type="button"
                  onClick={() => play(c.t)}
                  aria-current={on ? "step" : undefined}
                  className={`flex w-full flex-col gap-0.5 px-3 py-2.5 text-left text-[13px] leading-snug lg:flex-row lg:items-baseline lg:gap-2.5 transition-colors hover:bg-accent/5 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent sm:px-4 ${on ? "bg-accent/[0.07] text-accent" : "text-ink"}`}
                >
                  <span className="sr-only">Play from </span>
                  <span className={`shrink-0 text-[11px] tabular-nums lg:w-7 ${on ? "text-accent" : "text-muted"}`}>{clock(c.t)}</span>
                  <span className="min-w-0">{c.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
