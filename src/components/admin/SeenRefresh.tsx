"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** After a page marks items seen, refresh once so the sidebar badges drop. Renders nothing. */
export function SeenRefresh({ on }: { on: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (on) router.refresh();
  }, [on, router]);
  return null;
}
