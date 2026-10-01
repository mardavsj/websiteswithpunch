"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

/**
 * Subtle "← Back to dashboard" on shared public pages (contact, terms, privacy), signed-in only.
 * It sits in the page's top padding (the page container is `relative`), so appearing once the
 * session is known never shifts the content, and signed-out visitors see the page unchanged.
 */
export function InAppBackLink() {
  const { status } = useSession();
  if (status !== "authenticated") return null;
  return (
    <div className="absolute left-4 top-6 sm:left-6">
      <Link href="/dashboard" className="text-sm text-muted hover:text-accent">
        ← Back to dashboard
      </Link>
    </div>
  );
}
