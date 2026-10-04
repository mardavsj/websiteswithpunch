import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { MINUTE, rateLimit, tooMany } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limited = await rateLimit([{ key: `portal:user:${session.user.id}`, limit: 20, windowMs: 10 * MINUTE }]);
  if (!limited.ok) return tooMany(limited.retryAfterSec);

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "The billing portal is unavailable right now." },
      { status: 503 }
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Billing unavailable" }, { status: 503 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No billing account yet. Upgrade to a paid plan first." },
      { status: 400 }
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/dashboard`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (err) {
    console.error("portal error", err);
    return NextResponse.json({ error: "Could not open billing. Please try again." }, { status: 502 });
  }
}
