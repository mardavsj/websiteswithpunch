"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Marks its subtree with data-inview="true" once scrolled into view, so children can
 * animate with `group-data-[inview=true]:` utilities. Reduced motion shows the end state.
 */
export function InView({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} data-inview={shown ? "true" : "false"} className={`group ${className}`}>
      {children}
    </div>
  );
}
