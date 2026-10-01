"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { ReactNode } from "react";
import { ToastProvider } from "@/components/Toast";

/**
 * `session` comes from the root layout, so useSession() is already settled on the first render:
 * no logged-out flash in the navbar, and SiteChrome can pick the right footer server-side.
 */
export function Providers({ children, session }: { children: ReactNode; session?: Session | null }) {
  return (
    <SessionProvider session={session}>
      <ToastProvider>{children}</ToastProvider>
    </SessionProvider>
  );
}
