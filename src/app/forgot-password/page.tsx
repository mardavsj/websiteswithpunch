import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { NO_INDEX } from "@/lib/site-config";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Forgot password", robots: NO_INDEX };

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <ForgotForm />
    </AuthShell>
  );
}
