"use client";

import { useRef, useState } from "react";
import { TOUR, TOUR_CHAPTERS, clock } from "./tour-content";
import { CenterControl } from "./TourControls";

const panel = "border border-rule bg-surface";
const shadow = "shadow-[8px_8px_0_0_hsl(var(--accent)/0.18)]";

/** Homepage tour: click-to-play, centered controls, chapters and native captions/fullscreen. */
export function TourPlayer() {
  const ref = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
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

  const idle = !started || ended || (started && !playing);

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
        <div className="group/video relative aspect-video bg-[#f3f3f1]">
          <video
            ref={ref}
            className="absolute inset-0 h-full w-full focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
            preload="none"
            playsInline
            controls={started && !ended}
            tabIndex={started ? 0 : -1}
            aria-label={`${TOUR.name}. ${TOUR.description}`}
            onPlay={() => {
              setStarted(true);
              setPlaying(true);
              setEnded(false);
            }}
            onPause={() => setPlaying(false)}
            onTimeUpdate={onTime}
            onEnded={() => {
              setEnded(true);
              setPlaying(false);
            }}
          >
            <source src={TOUR.mp4Small} type="video/mp4" media="(max-width: 767px)" />
            <source src={TOUR.webm} type='video/webm; codecs="av01.0.08M.08, opus"' />
            <source src={TOUR.mp4} type="video/mp4" />
            <track kind="captions" src={TOUR.captions} srcLang="en" label="English" />
          </video>

          {idle ? (
            <button
              type="button"
              onClick={() => play(ended ? 0 : undefined)}
              aria-label={ended ? "Watch the tour again" : `Play the ${TOUR.seconds}-second product tour`}
              className="group absolute inset-0 z-[1] flex items-center justify-center focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
            >
              {!started ? (
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
                  <span className="absolute inset-0 bg-ink/25 transition-colors group-hover:bg-ink/20 dark:bg-black/45" aria-hidden />
                </>
              ) : (
                <span className="absolute inset-0 bg-bg/55 backdrop-blur-[1px] dark:bg-black/50" aria-hidden />
              )}
              <CenterControl kind={ended ? "replay" : "play"} />
            </button>
          ) : null}

          {started && playing && !ended ? (
            <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover/video:opacity-100 [@media(hover:none)]:opacity-90">
              <span className="absolute inset-0 bg-ink/20 dark:bg-black/35" aria-hidden />
              <button
                type="button"
                onClick={() => ref.current?.pause()}
                aria-label="Pause the tour"
                className="group relative pointer-events-auto rounded-full focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                <CenterControl kind="pause" />
              </button>
            </div>
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
                  className={`flex w-full flex-col gap-0.5 px-3 py-2.5 text-left text-[13px] leading-snug transition-colors hover:bg-accent/5 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent sm:px-4 lg:flex-row lg:items-baseline lg:gap-2.5 ${on ? "bg-accent/[0.07] text-accent" : "text-ink"}`}
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
