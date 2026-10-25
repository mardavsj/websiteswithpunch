"use client";

import { useEffect, useState } from "react";
import { ratePercent } from "@/lib/referrals/config";

/** One line of pitch + the link. Nothing else lives here on purpose. */
export function ReferralHero({ link }: { link: string }) {
  const [copied, setCopied] = useState<"ok" | "fail" | null>(null);
  // Server can't know about navigator.share; decide after mount so the first client render matches the server HTML.
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare(typeof navigator.share === "function"), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <section className="border border-rule bg-surface px-4 py-5 sm:px-6">
      <h2 className="font-display text-xl font-medium tracking-tight text-ink sm:text-2xl">
        Earn {ratePercent}% when friends you refer pay
      </h2>
      <label htmlFor="ref-link" className="sr-only">Your referral link</label>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          id="ref-link"
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 border border-rule bg-bg px-3 py-2.5 font-mono text-sm text-ink focus:border-accent focus:outline-none"
        />
        <div className="flex gap-2">
          <button type="button" onClick={copy} className="flex-1 bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover sm:flex-none">
            {copied === "ok" ? "Copied" : "Copy"}
          </button>
          {canShare && (
            <button
              type="button"
              onClick={() => navigator.share({ title: "Websites With Punch", text: "Monitor uptime, SSL and domain expiry for your sites.", url: link }).catch(() => undefined)}
              className="flex-1 border border-rule px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent sm:flex-none"
            >
              Share
            </button>
          )}
        </div>
      </div>
      {copied === "fail" && <p className="mt-1.5 text-xs text-danger" role="alert">Couldn&apos;t copy. Select the link and copy it manually.</p>}
    </section>
  );
}
