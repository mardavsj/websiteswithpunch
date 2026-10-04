"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

/** Auth pages fill the viewport under the navbar and have no footer. */
export const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password", "/verify-email"];
/** Logged-in app pages get the slim app footer instead of the big marketing footer. */
export const APP_ROUTES = ["/dashboard", "/plan", "/profile"];
/** Public pages that also feel in-app (slim footer) when someone is signed in. */
export const SHARED_ROUTES = ["/terms", "/privacy"];
/**
 * Pages whose content is centred between the navbar and the footer: <main> becomes a flex column
 * that fills that space, and the page's flex-1 box centres itself inside it.
 */
export const CENTRED_ROUTES = [...AUTH_ROUTES, "/plan", "/profile"];
/**
 * /contact renders its own <main> and footer from its server layout (contact/layout.tsx), which
 * knows the session on the server: the right footer is there on first paint, so the centred
 * content never jumps when the footer appears.
 */
export const OWN_CHROME_ROUTES = ["/contact"];

const matches = (routes: string[], pathname: string | null) =>
  !!pathname && routes.some((r) => pathname === r || pathname.startsWith(`${r}/`));

export function isAuthRoute(pathname: string | null): boolean {
  return matches(AUTH_ROUTES, pathname);
}

export function isAppRoute(pathname: string | null): boolean {
  return matches(APP_ROUTES, pathname);
}

/** Main area for centred pages (contact/layout.tsx uses the same classes). */
const CENTRED_MAIN = "flex flex-1 flex-col";

/**
 * Picks the footer: none on auth pages; slim on app pages; the big marketing footer on public
 * pages. Terms/privacy depend on the session, which the client resolves after load (the pages
 * stay static), so they render no footer until it's known: no wrong footer ever shows.
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
  if (matches(OWN_CHROME_ROUTES, pathname)) return <>{children}</>;
  const shared = matches(SHARED_ROUTES, pathname);
  let chosen: React.ReactNode = footer;
  if (isAuthRoute(pathname)) chosen = null;
  else if (shared && status === "loading") chosen = <noscript>{footer}</noscript>;
  else if (isAppRoute(pathname) || (shared && status === "authenticated")) chosen = appFooter;
  return (
    <>
      <main className={matches(CENTRED_ROUTES, pathname) ? CENTRED_MAIN : "flex-1"}>{children}</main>
      {chosen}
    </>
  );
}
