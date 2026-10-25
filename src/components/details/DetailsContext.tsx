"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { AnalyticsPayload } from "@/components/SiteAnalyticsBody";
import { Modal } from "@/components/Modal";
import { healthFixes } from "@/lib/insights/health";
import { healthInput, sectionInsight } from "@/lib/insights/sections";
import { insightStatus, scoreStatus } from "@/lib/insights/status";
import { Chip } from "./ui";
import { fixTitle } from "@/lib/insights/focus";
import type { FixKey } from "@/lib/insights/health";
import { DetailsPanel, SECTION_ICONS, SECTION_TITLES } from "./DetailsPanel";
import { FixView } from "./FixView";
import { IconGauge } from "./icons";
import { urlFor, viewFromSearch, type View } from "./url";
import type { DetailsSection, SiteDetails } from "./types";

type Ctx = { open: (s: DetailsSection) => void; openFix: (k?: FixKey) => void };
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
  const [view, setView] = useState<View | null>(null);
  const pushed = useRef(false);
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

  // Deep link: ?details=<section>&fix=<key>. Opening pushes a history entry so Back closes it.
  useEffect(() => {
    const sync = () => {
      pushed.current = false;
      setView(viewFromSearch(window.location.search));
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const show = useCallback(
    (v: View) => {
      if (view) window.history.replaceState(window.history.state, "", urlFor(v));
      else {
        window.history.pushState(window.history.state, "", urlFor(v));
        pushed.current = true;
      }
      setView(v);
      if (!details) void load();
    },
    [view, details, load],
  );
  const open = useCallback((s: DetailsSection) => show({ s }), [show]);
  const openFix = useCallback((k?: FixKey) => show({ s: "fixes", fix: k }), [show]);
  const close = useCallback(() => {
    if (pushed.current) return window.history.back();
    window.history.replaceState(window.history.state, "", urlFor(null));
    setView(null);
  }, []);

  const s = view?.s;
  const title = !s ? "" : s === "fixes" ? (view.fix ? fixTitle(view.fix) : "All fixes") : SECTION_TITLES[s];

  const hf = data ? healthFixes(healthInput(data, details)) : null;
  const st = !s || !data || !hf ? null : s === "fixes" || s === "health" ? scoreStatus(hf.score) : insightStatus(sectionInsight(s, data, details));
  const n = hf?.fixes.length ?? 0;
  const primary =
    !s || !n ? undefined
    : s === "fixes" && !view.fix ? { label: "Health score details", onClick: () => open("health") }
    : { label: `See all fixes (${n})`, onClick: () => openFix() };

  return (
    <DetailsCtx.Provider value={{ open, openFix }}>
      {children}
      <Modal
        open={view != null && data != null}
        title={title}
        icon={!s ? null : s === "fixes" ? <IconGauge /> : SECTION_ICONS[s]}
        subtitle={!s || !data ? undefined : s === "fixes" ? "Ways to raise your health score" : subtitleFor(s, data)}
        chip={st && <Chip tone={st.tone}>{st.label}</Chip>}
        primary={primary}
        onClose={close}
      >
        {s && data && s === "fixes" && <FixView data={data} details={details} fix={view.fix} />}
        {s && data && s !== "fixes" && (
          <DetailsPanel section={s} data={data} details={details} error={details ? null : error} onRetry={() => void load()} />
        )}
      </Modal>
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

/** Opens a Details panel from anywhere inside the provider (null outside it). */
export function useOpenDetails(): Ctx | null {
  return useContext(DetailsCtx);
}
