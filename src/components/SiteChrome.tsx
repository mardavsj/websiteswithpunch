"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

/** Auth pages fill the viewport under the navbar and have no footer. */
export const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];
/** Like the auth pages, /contact fills the viewport below the navbar and has no footer (for everyone). */
export const FULL_HEIGHT_ROUTES = [...AUTH_ROUTES, "/contact"];
/** Logged-in app pages get the slim app footer instead of the big marketing footer. */
export const APP_ROUTES = ["/dashboard", "/plan", "/profile"];
/** Public pages that also feel in-app (slim footer) when someone is signed in. */
export const SHARED_ROUTES = ["/terms", "/privacy"];

const matches = (routes: string[], pathname: string | null) =>
  !!pathname && routes.some((r) => pathname === r || pathname.startsWith(`${r}/`));

export function isAuthRoute(pathname: string | null): boolean {
  return matches(AUTH_ROUTES, pathname);
}

export function isAppRoute(pathname: string | null): boolean {
  return matches(APP_ROUTES, pathname);
}

/**
 * Picks the footer: none on auth pages and /contact (they fill the viewport); slim on app pages;
 * the big marketing footer on public pages. Terms/privacy depend on the session, which the
 * client resolves after load (the pages stay static), so they render no footer until it's
 * known: no wrong footer ever shows.
 * Without JavaScript the session never resolves, so <noscript> keeps the public footer there.
 */
export function SiteChrome({
  children,
  footer,
  appFooter,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
  appFooter: React.ReactNode;
}) {
  const pathname = usePathname();
  const { status } = useSession();
  const full = matches(FULL_HEIGHT_ROUTES, pathname);
  const shared = matches(SHARED_ROUTES, pathname);
  let chosen: React.ReactNode = footer;
  if (full) chosen = null;
  else if (shared && status === "loading") chosen = <noscript>{footer}</noscript>;
  else if (isAppRoute(pathname) || (shared && status === "authenticated")) chosen = appFooter;
  return (
    <>
      <main className={full ? "flex flex-1 flex-col" : "flex-1"}>{children}</main>
      {chosen}
    </>
  );
}
