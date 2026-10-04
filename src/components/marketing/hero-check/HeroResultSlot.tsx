"use client";

import { useEffect, useRef, useState } from "react";
import { useHeroCheck } from "./HeroCheckProvider";

const reduced = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
const MS = 300;

/**
 * Full-width row under the hero's two columns (straight under the form when stacked). Slides
 * open/closed by animating grid rows 0fr ↔ 1fr with opacity, so there's no height measuring and
 * nothing above it moves. Focus goes to the card when the result lands, back to the input on close.
 */
export function HeroResultSlot() {
  const { open, loading, query, result, ui, close, setResult } = useHeroCheck();
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const region = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      let inner = 0;
      const outer = requestAnimationFrame(() => (inner = requestAnimationFrame(() => setShown(true))));
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), reduced() ? 0 : MS + 20);
    return () => clearTimeout(t);
  }, [open]);

  // Bring the card into view once it has finished opening (and again when the result lands).
  const reveal = () => region.current?.scrollIntoView({ block: "nearest", behavior: reduced() ? "auto" : "smooth" });

  useEffect(() => {
    if (shown && reduced()) reveal();
  }, [shown]);

  useEffect(() => {
    if (!open || !result) return;
    region.current?.focus({ preventScroll: true });
    reveal();
  }, [open, result]);

  const host = result?.host ?? query;
  // Always mounted, so screen readers hear "Checking…" and then the result summary.
  const live = (
    <p aria-live="polite" aria-atomic="true" className="sr-only">
      {!open || !ui ? "" : loading && !result ? `Checking ${query}…` : result ? ui.summary(result) : ""}
    </p>
  );
  if (!mounted || !ui) return live;

  return (
    <>
      {live}
      <div
        className={`order-3 grid transition-[grid-template-rows,opacity] ease-out motion-reduce:transition-none lg:order-none lg:col-span-2 ${
          shown ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
        style={{ transitionDuration: `${MS}ms` }}
        onTransitionEnd={(e) => {
          if (e.target === e.currentTarget && e.propertyName === "grid-template-rows" && shown) reveal();
        }}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            ref={region}
            tabIndex={-1}
            role="region"
            aria-label={`Check result for ${host}`}
            className="relative scroll-mb-6 pb-2 pr-2 pt-5 outline-none"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close the check result"
              title="Close"
              className="absolute right-6 top-[6px] z-10 flex h-7 w-7 items-center justify-center border border-rule bg-surface text-muted shadow-[2px_2px_0_0_hsl(var(--accent)/0.18)] hover:bg-accent-soft hover:text-ink"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="square" />
              </svg>
            </button>
            <div aria-busy={loading && !result}>
              {result ? <ui.HeroResult key={result.host} result={result} onResult={setResult} /> : <ui.HeroResultSkeleton query={query} />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
