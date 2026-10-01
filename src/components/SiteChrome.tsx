"use client";

import { usePathname } from "next/navigation";

/** Auth pages fill the viewport under the navbar and have no footer. */
export const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];
/** Logged-in app pages get the slim app footer instead of the big marketing footer. */
export const APP_ROUTES = ["/dashboard", "/plan", "/profile"];

const matches = (routes: string[], pathname: string | null) =>
  !!pathname && routes.some((r) => pathname === r || pathname.startsWith(`${r}/`));

export function isAuthRoute(pathname: string | null): boolean {
  return matches(AUTH_ROUTES, pathname);
}

export function isAppRoute(pathname: string | null): boolean {
  return matches(APP_ROUTES, pathname);
}

/** Picks the footer by route: none on auth pages, slim on app pages, big everywhere else. */
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
  const auth = isAuthRoute(pathname);
  return (
    <>
      <main className={auth ? "flex flex-1 flex-col" : "flex-1"}>{children}</main>
      {auth ? null : isAppRoute(pathname) ? appFooter : footer}
    </>
  );
}
