import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDodo } from "@/lib/dodo";
import { verifyWebhook } from "@/lib/dodo-webhook-verify";
import { syncSubscription } from "@/lib/dodo-sync";
import type { SubLike } from "@/lib/dodo-subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Dodo Payments webhooks (Standard Webhooks). Point the endpoint at
 * https://www.websiteswithpunch.com/api/webhooks/dodo and set DODO_PAYMENTS_WEBHOOK_KEY.
 *
 * - The signature is checked on the raw body before anything else (401 when it fails).
 * - Idempotent: the webhook-id is claimed in WebhookEvent first, so a retry or duplicate is
 *   acknowledged without running again; a failed run releases the claim so Dodo's retry can.
 * - Subscription events carry the full subscription; we mirror it (plan, packs, booked
 *   changes, cancel at period end, status). Events older than the last applied are skipped.
 * - Payment events re-read their subscription from the API and mirror that.
 */
type WebhookEvent = {
  type?: string;
  timestamp?: string;
  data?: { payload_type?: string; subscription_id?: string | null } & Partial<SubLike>;
};

const SUBSCRIPTION_EVENTS = new Set([
  "subscription.active",
  "subscription.updated",
  "subscription.renewed",
  "subscription.on_hold",
  "subscription.past_due",
  "subscription.paused",
  "subscription.unpaused",
  "subscription.plan_changed",
  "subscription.cancelled",
  "subscription.failed",
  "subscription.expired",
  "subscription.update_payment_method",
]);
const PAYMENT_EVENTS = new Set(["payment.succeeded", "payment.failed"]);

export async function POST(req: Request) {
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_KEY?.trim();
  if (!secret) {
    return NextResponse.json({ error: "Billing webhook not configured" }, { status: 503 });
  }

  const body = await req.text();
  const id = req.headers.get("webhook-id");
  const check = verifyWebhook(
    secret,
    { id, timestamp: req.headers.get("webhook-timestamp"), signature: req.headers.get("webhook-signature") },
    body,
  );
  if (!check.ok) {
    console.warn("[dodo webhook] rejected:", check.reason);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(body) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const type = String(event.type || "unknown");

  try {
    await prisma.webhookEvent.create({ data: { id: id!, type } });
  } catch (err) {
    if ((err as { code?: string })?.code === "P2002") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("[dodo webhook] idempotency claim failed", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  try {
    const eventAt = event.timestamp ? new Date(event.timestamp) : null;
    const data = event.data;
    if (SUBSCRIPTION_EVENTS.has(type) && data?.subscription_id && data.product_id && data.status) {
      const result = await syncSubscription(data as SubLike, { eventAt });
      if (result === "no_user") console.warn("[dodo webhook] no user for", data.subscription_id, type);
    } else if (PAYMENT_EVENTS.has(type) && data?.subscription_id) {
      const dodo = getDodo();
      if (dodo) {
        const sub = await dodo.subscriptions.retrieve(data.subscription_id);
        await syncSubscription(sub, { eventAt });
      }
    }
  } catch (err) {
    console.error("[dodo webhook] handler error", type, err);
    await prisma.webhookEvent.delete({ where: { id: id! } }).catch(() => undefined);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
