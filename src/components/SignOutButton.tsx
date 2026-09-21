"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-none border border-rule px-4 py-2 text-sm font-medium text-ink hover:bg-accent-soft"
    >
      Sign out
    </button>
  );
}
