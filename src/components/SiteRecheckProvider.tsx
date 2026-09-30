"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useSiteRecheck, type SiteRecheck } from "./useAutoUpdate";

const RecheckContext = createContext<SiteRecheck | null>(null);

/**
 * Shares one Recheck / auto refresh controller (one cooldown, one timer)
 * between the site card and the analytics panel on the analytics page.
 * Unmounting it (leaving the page) turns auto refresh off.
 */
export function SiteRecheckProvider({
  siteId,
  lastCheckedAt,
  children,
}: {
  siteId: string;
  lastCheckedAt?: string | null;
  children: ReactNode;
}) {
  const value = useSiteRecheck(siteId, lastCheckedAt);
  return <RecheckContext.Provider value={value}>{children}</RecheckContext.Provider>;
}

/** The shared controller for this site, or null outside a provider. */
export function useSiteRecheckContext(siteId: string): SiteRecheck | null {
  const value = useContext(RecheckContext);
  return value && value.siteId === siteId ? value : null;
}
