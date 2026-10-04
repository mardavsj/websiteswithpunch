import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VERIFICATION_STARTED_AT } from "@/lib/email-verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST — "Wrong email?": delete the signed-in account if it was never verified and has nothing
 * attached (no sites, no Stripe customer), so the person can sign up again with the right address.
 */
export async function POST() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.user.deleteMany({
    where: {
      id: session.user.id,
      emailVerified: null,
      createdAt: { gte: VERIFICATION_STARTED_AT },
      stripeCustomerId: null,
      sites: { none: {} },
    },
  });
  return NextResponse.json({ ok: true });
}
