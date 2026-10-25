import type { Metadata } from "next";
import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { cleanCode } from "@/lib/referrals/attribution";
import { ReferralDashboard } from "@/components/referrals/Dashboard";
import { ReferralLanding } from "@/components/referrals/Landing";
import { ReferralsSkeleton } from "@/components/skeleton/ReferralsSkeleton";

export const dynamic = "force-dynamic";

const title = "Referral program: earn 20% when friends you refer pay";
const description =
  "Share your link. You get 20% on Pro and Business plan payments from people you refer (site packs excluded). Withdraw from $20 via PayPal or UPI.";

export const metadata: Metadata = {
  title: "Referral program",
  description,
  alternates: { canonical: "/referrals" },
  openGraph: { title, description, url: "/referrals" },
  twitter: { title, description },
};

/** Logged out: public program page. Logged in: the dashboard, with a skeleton while it loads. */
export default async function ReferralsPage({ searchParams }: { searchParams: { ref?: string } }) {
  const session = await getSession();
  if (!session?.user?.id) return <ReferralLanding refCode={cleanCode(searchParams.ref)} />;
  return (
    <Suspense fallback={<ReferralsSkeleton />}>
      <ReferralDashboard userId={session.user.id} />
    </Suspense>
  );
}
