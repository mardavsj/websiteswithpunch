import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NO_INDEX } from "@/lib/site-config";
import { isVerified, maskEmail, resendCooldown } from "@/lib/email-verify";
import { parseInterval } from "@/lib/billing-interval";
import { AuthShell } from "@/components/auth/AuthShell";
import { VerifyForm } from "./verify-form";

export const metadata: Metadata = {
  title: "Verify your email",
  description: "Enter the 6-digit code we emailed you.",
  robots: NO_INDEX,
};
export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { plan?: string; interval?: string };
}) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, emailVerified: true, createdAt: true },
  });
  if (!user) redirect("/login");
  if (isVerified(user)) redirect("/dashboard");

  const [cooldown, active] = await Promise.all([
    resendCooldown(user.id),
    prisma.emailVerificationCode.count({
      where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
    }),
  ]);
  const plan = searchParams.plan === "pro" || searchParams.plan === "business" ? searchParams.plan : null;

  return (
    <AuthShell>
      <VerifyForm
        masked={maskEmail(user.email)}
        initialCooldown={cooldown}
        hasCode={active > 0}
        plan={plan}
        interval={parseInterval(searchParams.interval)}
      />
    </AuthShell>
  );
}
