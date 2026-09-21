import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await getSession();
  if (session?.user) redirect("/dashboard");

  return (
    <Suspense fallback={<div className="p-16 text-center text-muted">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
