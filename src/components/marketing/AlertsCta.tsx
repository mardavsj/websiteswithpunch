"use client";

import Link from "next/link";
import { rememberPendingSite } from "@/lib/pending-site";
import { signupHref } from "@/lib/signup-link";
import { FREE_TRUST } from "./StartCta";

/**
 * "Get alerts free" under a one-off check: signup link with the site carried in ?site=, and the
 * site remembered in this browser so the dashboard opens it ready to add after signup.
 */
export function AlertsCta({ host, lead }: { host: string; lead?: string }) {
  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-rule pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted">
        {lead ?? "Get an email when it goes down, and before SSL or the domain expires."}
        <span className="block text-xs">{FREE_TRUST}</span>
      </p>
      <Link
        href={signupHref(host)}
        onClick={() => rememberPendingSite({ name: host, url: `https://${host}` })}
        className="inline-flex shrink-0 justify-center bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover"
      >
        Get alerts free
      </Link>
    </div>
  );
}
