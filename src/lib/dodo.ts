/**
 * Dodo Payments client (server only). Test mode until DODO_PAYMENTS_ENVIRONMENT=live_mode;
 * the SDK picks the base URL (test.dodopayments.com / live.dodopayments.com) from it.
 */
import DodoPayments from "dodopayments";
import { productIdFor } from "./dodo-products";

export type DodoEnvironment = "test_mode" | "live_mode";

export function dodoEnvironment(): DodoEnvironment {
  return process.env.DODO_PAYMENTS_ENVIRONMENT?.trim() === "live_mode" ? "live_mode" : "test_mode";
}

let cached: DodoPayments | null = null;

export function getDodo(): DodoPayments | null {
  const key = process.env.DODO_PAYMENTS_API_KEY?.trim();
  if (!key) return null;
  if (!cached) {
    cached = new DodoPayments({
      bearerToken: key,
      environment: dodoEnvironment(),
      webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY?.trim() || null,
      maxRetries: 2,
      timeout: 20_000,
    });
  }
  return cached;
}

/** API key plus at least the monthly Pro product: enough to sell the main plan. */
export function isDodoConfigured(): boolean {
  return Boolean(process.env.DODO_PAYMENTS_API_KEY?.trim() && productIdFor("pro", "month"));
}

/** Base URL for return links (checkout, portal). */
export function appUrl(): string {
  return (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}

/**
 * Text safe to show for a failed Dodo call. API errors carry a readable message (e.g.
 * "Changing plans is not supported for inactive subscriptions"); others get the fallback.
 */
export function dodoUserMessage(err: unknown, fallback: string): string {
  const e = err as { status?: number; error?: { message?: string } };
  const msg = e?.error?.message;
  return typeof e?.status === "number" && e.status >= 400 && e.status < 500 && msg ? msg : fallback;
}

/** HTTP status of a Dodo API error (409 = a plan change is already pending, …). */
export function dodoErrorStatus(err: unknown): number | null {
  const s = (err as { status?: unknown })?.status;
  return typeof s === "number" ? s : null;
}
