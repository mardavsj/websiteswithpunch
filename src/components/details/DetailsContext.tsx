"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { AnalyticsPayload } from "@/components/SiteAnalyticsBody";
import { DetailsDrawer } from "./DetailsDrawer";
import { DetailsPanel, SECTION_ICONS, SECTION_TITLES } from "./DetailsPanel";
import type { DetailsSection, SiteDetails } from "./types";

type Ctx = { open: (s: DetailsSection) => void };
const DetailsCtx = createContext<Ctx | null>(null);

/**
 * Owns the analytics Details sheet. The extra facts (/details) load once in the background
 * after the analytics, and again after a check, so a panel usually opens with no wait.
 */
export function DetailsProvider({
  siteId,
  data,
  children,
}: {
  siteId: string;
  data: AnalyticsPayload | null;
  children: ReactNode;
}) {
  const [section, setSection] = useState<DetailsSection | null>(null);
  const [details, setDetails] = useState<SiteDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);

  const load = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const res = await fetch(`/api/sites/${siteId}/details`, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Could not load details.");
      setDetails(json as SiteDetails);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load details.");
    } finally {
      busy.current = false;
    }
  }, [siteId]);

  // Refresh whenever a new check lands (the newest check time changes).
  const checkKey = data ? `${data.site?.lastCheckedAt ?? ""}|${data.dataEndsAt ?? ""}` : null;
  useEffect(() => {
    if (!checkKey) return;
    const t = setTimeout(() => void load(), 250);
    return () => clearTimeout(t);
  }, [checkKey, load]);

  const open = useCallback(
    (s: DetailsSection) => {
      setSection(s);
      if (!details) void load();
    },
    [details, load],
  );
  const close = useCallback(() => setSection(null), []);

  return (
    <DetailsCtx.Provider value={{ open }}>
      {children}
      <DetailsDrawer
        open={section != null && data != null}
        title={section ? SECTION_TITLES[section] : ""}
        icon={section ? SECTION_ICONS[section] : null}
        subtitle={section && data ? subtitleFor(section, data) : undefined}
        onClose={close}
      >
        {section && data && (
          <DetailsPanel
            section={section}
            data={data}
            details={details}
            error={details ? null : error}
            onRetry={() => void load()}
          />
        )}
      </DetailsDrawer>
    </DetailsCtx.Provider>
  );
}

const RANGE_TEXT: Record<string, string> = {
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "All time (up to 90 days)",
};

function subtitleFor(s: DetailsSection, data: AnalyticsPayload): string {
  if (s === "ssl" || s === "domain") return "From the latest check of this site";
  const r = RANGE_TEXT[data.range] ?? data.range;
  return data.stale ? `${r}, last saved window` : r;
}

/** Small "Details" button for the top-right of an analytics card. */
export function DetailsButton({ section, label }: { section: DetailsSection; label: string }) {
  const ctx = useContext(DetailsCtx);
  if (!ctx) return null;
  return (
    <button
      type="button"
      onClick={() => ctx.open(section)}
      aria-haspopup="dialog"
      aria-label={`${label} details`}
      className="-my-[3px] shrink-0 border border-rule px-2 py-0.5 text-[11px] font-medium leading-4 text-muted transition-colors hover:border-accent/50 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
    >
      Details
    </button>
  );
}
