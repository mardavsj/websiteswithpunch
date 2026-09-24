import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json({ invoices: [], configured: false });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.stripeCustomerId) {
    return NextResponse.json({ invoices: [], configured: true });
  }

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ invoices: [], configured: false });

  try {
    const list = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit: 12,
    });
    const invoices = list.data.map((inv) => ({
      id: inv.id,
      number: inv.number,
      status: inv.status,
      amountPaid: inv.amount_paid,
      amountDue: inv.amount_due,
      currency: inv.currency,
      created: inv.created,
      createdFormatted: new Date(inv.created * 1000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      amountFormatted: `$${((inv.status === "paid" ? inv.amount_paid : inv.amount_due) / 100).toFixed(2)}`,
      description:
        inv.lines?.data
          ?.map((l) => l.description)
          .filter(Boolean)
          .slice(0, 3)
          .join(" · ") || inv.description || "Invoice",
      hostedInvoiceUrl: inv.hosted_invoice_url,
      pdf: inv.invoice_pdf,
    }));
    return NextResponse.json({ invoices, configured: true });
  } catch (err) {
    console.error("invoices list error", err);
    return NextResponse.json({ invoices: [], configured: true, error: "Could not load invoices." });
  }
}
