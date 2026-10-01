"use client";

import { usePathname } from "next/navigation";

/** Auth pages fill the viewport under the navbar and have no footer. */
export const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];

export function isAuthRoute(pathname: string | null): boolean {
  return !!pathname && AUTH_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

export function SiteChrome({ children, footer }: { children: React.ReactNode; footer: React.ReactNode }) {
  const auth = isAuthRoute(usePathname());
  return (
    <>
      <main className={auth ? "flex flex-1 flex-col" : "flex-1"}>{children}</main>
      {auth ? null : footer}
    </>
  );
}
