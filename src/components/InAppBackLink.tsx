"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

/** Subtle "← Back to dashboard" on shared public pages (contact, terms, privacy), signed-in only. */
export function InAppBackLink({ className = "mb-6" }: { className?: string }) {
  const { status } = useSession();
  if (status !== "authenticated") return null;
  return (
    <div className={className}>
      <Link href="/dashboard" className="text-sm text-muted hover:text-accent">
        ← Back to dashboard
      </Link>
    </div>
  );
}
