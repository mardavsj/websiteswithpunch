import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDodo, isDodoConfigured } from "@/lib/dodo";
import { formatChargeToday } from "@/lib/billing-format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  succeeded: "paid",
  failed: "failed",
  cancelled: "cancelled",
  processing: "processing",
  requires_customer_action: "action needed",
  requires_payment_method: "action needed",
};

/** Last 12 Dodo payments for the user, each with Dodo's invoice PDF link when there is one. */
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dodo = isDodoConfigured() ? getDodo() : null;
  if (!dodo) return NextResponse.json({ invoices: [], configured: false });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.dodoCustomerId) return NextResponse.json({ invoices: [], configured: true });

  try {
    const page = await dodo.payments.list({ customer_id: user.dodoCustomerId, page_size: 12 });
    const invoices = page.items.map((p) => ({
      id: p.payment_id,
      createdFormatted: new Date(p.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      description: p.subscription_id ? "Websites With Punch subscription" : "Websites With Punch",
      amountFormatted: formatChargeToday(p.total_amount, p.currency),
      status: (p.status && STATUS_LABEL[p.status]) || p.status || null,
      invoiceUrl: p.invoice_url || null,
    }));
    return NextResponse.json({ invoices, configured: true });
  } catch (err) {
    console.error("invoices list error", err);
    return NextResponse.json({ invoices: [], configured: true, error: "Could not load invoices." });
  }
}
