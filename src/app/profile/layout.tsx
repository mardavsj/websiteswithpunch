import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NO_INDEX } from "@/lib/site-config";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { robots: NO_INDEX };

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  if (session.user.verified === false) redirect("/verify-email");
  return <>{children}</>;
}
