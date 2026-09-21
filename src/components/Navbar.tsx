"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function Navbar() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href={session ? "/dashboard" : "/"}
          className="flex items-center gap-2.5 font-display text-base font-medium text-ink"
        >
          <img
            src="https://websiteswithpunch.com/logo.png"
            alt="Websites With Punch"
            className="h-8 w-8 object-contain"
          />
          <span>Websites With Punch</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {status === "loading" ? null : session ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-none px-3 py-1.5 text-ink hover:bg-accent-soft"
              >
                Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-none border border-rule px-3 py-1.5 text-ink hover:bg-accent-soft"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/#features" className="hidden text-muted hover:text-ink sm:inline">
                Features
              </Link>
              <Link href="/#pricing" className="hidden text-muted hover:text-ink sm:inline">
                Pricing
              </Link>
              <Link
                href="/login"
                className="rounded-none px-3 py-1.5 text-ink hover:bg-accent-soft"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-none bg-accent px-3 py-1.5 font-medium text-white hover:bg-accent-hover"
              >
                Start free
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
