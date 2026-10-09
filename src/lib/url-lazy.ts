"use client";

import { useEffect, useState } from "react";

/**
 * lib/url pulls in tldts (the public suffix list, ~125 KB). Forms load it when they mount
 * instead of with the dashboard, so the dashboard's first load stays light.
 */
type UrlLib = typeof import("./url");
let pending: Promise<UrlLib> | null = null;

export function loadUrlLib(): Promise<UrlLib> {
  return (pending ??= import("./url"));
}

/** The module once loaded (null for the first moment after mount). */
export function useUrlLib(): UrlLib | null {
  const [lib, setLib] = useState<UrlLib | null>(null);
  useEffect(() => {
    let live = true;
    loadUrlLib().then((m) => live && setLib(m), () => undefined);
    return () => {
      live = false;
    };
  }, []);
  return lib;
}
