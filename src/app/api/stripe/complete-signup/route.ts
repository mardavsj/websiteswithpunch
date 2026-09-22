import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { upsertUserFromPaidSignupSession } from "@/lib/complete-paid-signup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.redirect(`${baseUrl}/signup?error=missing_session`);
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.redirect(`${baseUrl}/signup?error=billing`);
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const paid =
      session.payment_status === "paid" ||
      session.status === "complete" ||
      session.payment_status === "no_payment_required";

    if (!paid || session.metadata?.signup !== "1") {
      return NextResponse.redirect(`${baseUrl}/signup?error=incomplete`);
    }

    const result = await upsertUserFromPaidSignupSession(session);
    if (!result.ok) {
      console.error("complete-signup upsert failed", result.reason);
      return NextResponse.redirect(`${baseUrl}/signup?error=account`);
    }

    return NextResponse.redirect(`${baseUrl}/login?paid=1`);
  } catch (err) {
    console.error("complete-signup error", err);
    return NextResponse.redirect(`${baseUrl}/signup?error=complete_failed`);
  }
}
