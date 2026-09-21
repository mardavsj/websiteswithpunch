import Stripe from "stripe";
import { stripePriceIdForPlan } from "./plans";

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export function isStripeConfigured(): boolean {
  const hasKeys = Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  );
  const hasPro = Boolean(stripePriceIdForPlan("pro"));
  return hasKeys && hasPro;
}
