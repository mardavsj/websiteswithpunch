import { NextResponse } from "next/server";
import { appUrl, dodoUserMessage } from "@/lib/dodo";
import { fail, loadUser } from "@/lib/billing-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One-time link into the Dodo customer portal (payment method, invoices, billing details,
 * cancel at period end). Created per click; the link signs the customer straight in.
 */
export async function POST() {
  const loaded = await loadUser({ label: "portal", rateKey: "portal", rateLimit: 20 });
  if (loaded instanceof NextResponse) return loaded;
  const { user, dodo } = loaded;
  if (!user.dodoCustomerId) {
    return fail(400, "No billing account yet. Upgrade to a paid plan first.");
  }
  try {
    const session = await dodo.customers.customerPortal.create(user.dodoCustomerId, {
      return_url: `${appUrl()}/plan`,
      send_email: false,
    });
    return NextResponse.json({ url: session.link });
  } catch (err) {
    console.error("billing portal error", err);
    return fail(502, dodoUserMessage(err, "Could not open billing. Please try again."));
  }
}
