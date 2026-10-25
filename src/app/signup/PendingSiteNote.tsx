"use client";

import { useEffect } from "react";
import { rememberPendingSite } from "@/lib/pending-site";

/** Shown when signup was opened from a check (?site=): the dashboard opens it ready to add. */
export function PendingSiteNote({ host }: { host: string }) {
  useEffect(() => {
    rememberPendingSite({ name: host, url: `https://${host}` });
  }, [host]);
  return (
    <p className="mb-6 border border-rule bg-accent-soft px-3 py-2 text-sm text-ink">
      After you sign up, <span className="font-medium">{host}</span> is ready to add on your dashboard.
    </p>
  );
}
