import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage() {
  const session = await getSession();
  if (session?.user) redirect("/dashboard");

  return (
    <AuthShell>
      <Suspense fallback={<div className="py-16 text-center text-sm text-muted">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
