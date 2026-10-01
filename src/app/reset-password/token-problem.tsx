import Link from "next/link";
import { AuthHeading, AuthNotice } from "@/components/auth/AuthShell";

export type TokenProblemState = "expired" | "used" | "invalid";

const COPY: Record<TokenProblemState, { title: string; body: string }> = {
  expired: {
    title: "This link has expired",
    body: "Reset links work for 1 hour. Request a new one and use it within the hour.",
  },
  used: {
    title: "This link has already been used",
    body: "Each reset link works once. If you still need to change your password, request a new link.",
  },
  invalid: {
    title: "This link isn't valid",
    body: "The link may be incomplete or replaced by a newer one. Use the latest email we sent, or request a new link.",
  },
};

export function TokenProblem({ state }: { state: TokenProblemState }) {
  const { title, body } = COPY[state];
  return (
    <>
      <AuthHeading title={title} />
      <AuthNotice tone={state === "invalid" ? "error" : "warning"}>{body}</AuthNotice>
      <Link
        href="/forgot-password"
        className="mt-6 flex w-full items-center justify-center rounded-none bg-accent py-2.5 text-sm font-semibold text-white hover:bg-accent-hover"
      >
        Request a new link
      </Link>
      <p className="mt-6 text-sm">
        <Link href="/login" className="font-medium text-accent hover:underline">
          Back to log in
        </Link>
      </p>
    </>
  );
}
