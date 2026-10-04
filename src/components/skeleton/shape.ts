"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";

/**
 * Remembers the signed-in account's layout (plan, site counts) in localStorage so the next
 * loading skeleton can draw the same number of cards and sections as the real page.
 * Holds counts only — no names, URLs or personal data.
 */
export type LayoutShape = {
  plan: "free" | "pro" | "business";
  active: number;
  locked: number;
  limit: number;
  billing: boolean;
  /** Per site card, in page order: [name length, URL length, locked 0/1]. */
  cards: Array<[number, number, number]>;
};

const KEY = "wwp:layout";
const DEFAULT: LayoutShape = { plan: "free", active: 1, locked: 0, limit: 1, billing: false, cards: [] };

const subscribe = () => () => {};
const read = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export function useLayoutShape(): LayoutShape {
  const raw = useSyncExternalStore(subscribe, read, () => null);
  return useMemo(() => {
    if (!raw) return DEFAULT;
    try {
      const v = JSON.parse(raw) as Partial<LayoutShape>;
      const n = (x: unknown, max = 12) =>
        typeof x === "number" && x >= 0 ? Math.min(Math.floor(x), max) : 0;
      return {
        plan: v.plan === "pro" || v.plan === "business" ? v.plan : "free",
        active: n(v.active),
        locked: n(v.locked),
        limit: typeof v.limit === "number" && v.limit > 0 ? Math.min(Math.floor(v.limit), 9999) : 1,
        billing: Boolean(v.billing),
        cards: Array.isArray(v.cards)
          ? v.cards
              .filter((c) => Array.isArray(c) && c.length === 3 && c.every((x) => typeof x === "number"))
              .slice(0, 12)
              .map((c) => [n(c[0], 80) || 12, n(c[1], 120) || 19, c[2] ? 1 : 0] as [number, number, number])
          : [],
      };
    } catch {
      return DEFAULT;
    }
  }, [raw]);
}

/** Rendered by the real dashboard and plan pages to record the current shape. */
export function RememberLayout(shape: Partial<LayoutShape>) {
  const json = JSON.stringify(shape);
  useEffect(() => {
    try {
      const prev = JSON.parse(localStorage.getItem(KEY) || "{}");
      localStorage.setItem(KEY, JSON.stringify({ ...prev, ...JSON.parse(json) }));
    } catch {
      /* storage unavailable: skeletons fall back to the default shape */
    }
  }, [json]);
  return null;
}
