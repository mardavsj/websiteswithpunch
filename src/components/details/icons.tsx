import type { ReactNode } from "react";

/** Tiny stroke icons for the Details sheet (16px, currentColor). */
function Svg({ children, className = "h-4 w-4" }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {children}
    </svg>
  );
}

type I = { className?: string };
export const IconShield = (p: I) => <Svg {...p}><path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></Svg>;
export const IconGlobe = (p: I) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" /></Svg>;
export const IconClock = (p: I) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>;
export const IconServer = (p: I) => <Svg {...p}><rect x="4" y="4" width="16" height="7" /><rect x="4" y="13" width="16" height="7" /><path d="M8 7.5h.01M8 16.5h.01" /></Svg>;
export const IconList = (p: I) => <Svg {...p}><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" /></Svg>;
export const IconPulse = (p: I) => <Svg {...p}><path d="M3 12h4l2-6 4 12 2-6h6" /></Svg>;
export const IconAlert = (p: I) => <Svg {...p}><path d="M12 4l9 16H3l9-16z" /><path d="M12 10v4M12 17h.01" /></Svg>;
export const IconInfo = (p: I) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></Svg>;
export const IconGauge = (p: I) => <Svg {...p}><path d="M4 16a8 8 0 1116 0" /><path d="M12 16l4-5" /></Svg>;
export const IconLink = (p: I) => <Svg {...p}><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" /></Svg>;
export const IconHash = (p: I) => <Svg {...p}><path d="M5 9h14M5 15h14M10 4L8 20M16 4l-2 16" /></Svg>;
export const IconCalendar = (p: I) => <Svg {...p}><rect x="4" y="5" width="16" height="15" /><path d="M4 10h16M9 3v4M15 3v4" /></Svg>;
