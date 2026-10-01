"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { GuestMenu } from "@/components/GuestMenu";
import { NavUpgradeButtons } from "@/components/NavUpgradeButtons";
import { ProfileMenu } from "@/components/ProfileMenu";
import { ThemeToggle } from "@/components/ThemeToggle";

/** Signed-in visitors are redirected away from these, so they always show the guest navbar. */
const GUEST_ONLY = ["/login", "/signup"];

export function Navbar() {
  const { data, status: rawStatus } = useSession();
  // While a sign-in is navigating away from /login or /signup, keep the guest navbar so it
  // switches together with the page instead of flipping over the still-visible form.
  const guestOnly = GUEST_ONLY.includes(usePathname() ?? "");
  const session = guestOnly ? null : data;
  const status = guestOnly ? "unauthenticated" : rawStatus;

  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl min-w-0 items-center justify-between gap-2 px-4 py-4 sm:px-6">
        <Link
          href={session ? "/dashboard" : "/"}
          className="flex min-w-0 items-center gap-2 font-display text-sm font-medium text-ink sm:gap-2.5 sm:text-base"
        >
          <Image
            src="/logo.svg"
            alt="Websites With Punch"
            width={32}
            height={32}
            priority
            unoptimized
            className="h-7 w-7 shrink-0 object-contain md:h-8 md:w-8"
          />
          <span className="truncate">Websites With Punch</span>
        </Link>
        <nav className="flex shrink-0 items-center gap-2 text-sm">
          {status === "loading" ? (
            <ThemeToggle />
          ) : session ? (
            <>
              <NavUpgradeButtons />
              <ThemeToggle />
              <ProfileMenu />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-none px-3 py-1.5 text-ink hover:bg-accent-soft md:inline-flex"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="hidden rounded-none bg-accent px-3 py-1.5 font-medium text-white hover:bg-accent-hover md:inline-flex"
              >
                Start free
              </Link>
              <ThemeToggle />
              <div className="md:hidden">
                <GuestMenu />
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
