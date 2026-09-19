"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function Navbar() {
  const { data: session, status } = useSession();

  return (
    <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm text-white">
            WP
          </span>
          <span>Websites With Punch</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/#features" className="hidden text-slate-600 hover:text-slate-900 sm:inline">
            Features
          </Link>
          <Link href="/#pricing" className="hidden text-slate-600 hover:text-slate-900 sm:inline">
            Pricing
          </Link>
          {status === "loading" ? null : session ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-1.5 text-slate-700 hover:bg-slate-100"
              >
                Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-1.5 text-slate-700 hover:bg-slate-100"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500"
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
