import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { checkResetToken } from "@/lib/password-reset";
import { ResetForm } from "./reset-form";
import { TokenProblem } from "./token-problem";

export const dynamic = "force-dynamic";

// Keep the token out of search engines and out of the Referer header.
export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string | string[] };
}) {
  const raw = searchParams.token;
  const token = Array.isArray(raw) ? raw[0] : raw;
  const { state } = await checkResetToken(token);

  return (
    <AuthShell>
      {state === "valid" && token ? <ResetForm token={token} /> : <TokenProblem state={state === "valid" ? "invalid" : state} />}
    </AuthShell>
  );
}
