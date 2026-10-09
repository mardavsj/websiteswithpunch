# Dodo Payments setup — Websites With Punch

Do everything in **Test Mode** first (toggle at the top of the Dodo dashboard), verify the flows below, then repeat
in **Live Mode** (see "Go live"). Test and live have **separate** API keys, products, add-ons, webhooks and IDs.

Docs used (all at https://docs.dodopayments.com): `/miscellaneous/test-mode-vs-live-mode`, `/features/products`,
`/features/addons`, `/developer-resources/webhooks`, `/api-reference/webhooks/intents/subscription`,
`/features/customer-portal`, `/developer-resources/subscription-upgrade-downgrade`, `/miscellaneous/testing-process`.

## 1. API key
Dashboard → **Developer → API Keys** → **Add API Key** (name it e.g. `wwp-vercel-test`). Copy it once →
`DODO_PAYMENTS_API_KEY`. Set `DODO_PAYMENTS_ENVIRONMENT=test_mode`.

## 2. Products (4 subscription products)
Dashboard → **Products → Create Product** → type **Subscription**. For each one: price in **USD**,
**tax category: SaaS (Software as a Service)**, no trial. Set the **subscription period** longer than the
billing interval (e.g. 10 years) so it renews until the customer cancels.

| Product name | Price | Repeat every | Env var |
|---|---|---|---|
| Websites With Punch Pro (Monthly) | $12 | 1 month | `DODO_PRODUCT_PRO_MONTHLY` |
| Websites With Punch Pro (Annual) | $120 | 1 year | `DODO_PRODUCT_PRO_ANNUAL` |
| Websites With Punch Business (Monthly) | $42 | 1 month | `DODO_PRODUCT_BUSINESS_MONTHLY` |
| Websites With Punch Business (Annual) | $420 | 1 year | `DODO_PRODUCT_BUSINESS_ANNUAL` |

Copy each product ID (`pdt_...`). Do **not** put these products in a Product Collection (that would let
customers change plans in the portal, which skips our site-limit checks).

## 3. Add-ons (site packs, 4)
Dashboard → **Products → Add-ons → Create Add-on** (tax category SaaS), then attach each add-on to the matching
product (product → edit → Add-ons). An add-on bills on its parent's cycle, so monthly and annual are separate.

| Add-on | Price | Attach to | Env var |
|---|---|---|---|
| Pro site pack (+5 sites), monthly | $6 | Pro (Monthly) | `DODO_ADDON_PACK_PRO_MONTHLY` |
| Pro site pack (+5 sites), annual | $60 | Pro (Annual) | `DODO_ADDON_PACK_PRO_ANNUAL` |
| Business site pack (+10 sites), monthly | $9 | Business (Monthly) | `DODO_ADDON_PACK_BUSINESS_MONTHLY` |
| Business site pack (+10 sites), annual | $90 | Business (Annual) | `DODO_ADDON_PACK_BUSINESS_ANNUAL` |

(Pack price: the site, code and Dodo appeal all say Business pack $9/mo, $90/yr. If you want $8, change
`SITE_PACKS` in `src/lib/plans.ts` and these add-ons together.)

## 4. Webhook
Dashboard → **Developer → Webhooks → Add Endpoint**:
- URL: `https://www.websiteswithpunch.com/api/webhooks/dodo` (use the www host; a redirect would break delivery)
- Events: `subscription.active`, `subscription.updated`, `subscription.renewed`, `subscription.on_hold`,
  `subscription.past_due`, `subscription.plan_changed`, `subscription.cancelled`, `subscription.failed`,
  `subscription.expired`, `subscription.paused`, `subscription.unpaused`, `subscription.update_payment_method`,
  `payment.succeeded`, `payment.failed`. (Selecting all events is also fine; others are acknowledged and ignored.)
- **Create endpoint** → open its **Overview** tab → copy the signing secret (`whsec_...`) → `DODO_PAYMENTS_WEBHOOK_KEY`.
- Rotating later: **Rotate secret** on the Overview tab, then update Vercel and redeploy (old secret works 24h).
- The endpoint's Logs / **Send test event** tab shows deliveries; a 200 means received, 401 means wrong secret.

## 5. Customer portal (Manage billing)
Dashboard → **Settings → Subscriptions**:
- **Allow Immediate Cancellation: OFF** (we promise "keep your plan until period end").
- **Allow Cancellation at Next Billing Date: ON**.
- **Allow Subscription Pause: OFF**.
- **Collect Plan Change Payments by Payment Link: OFF**.
- Plan changes stay in-app because the products aren't in a collection (no "Allow Subscription Updates").
The portal is used for payment method updates (incl. reactivating an on-hold subscription), invoices and cancel.

## 6. Vercel environment variables (Production; Preview optional)
`DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_WEBHOOK_KEY`, `DODO_PAYMENTS_ENVIRONMENT`,
`DODO_PRODUCT_PRO_MONTHLY`, `DODO_PRODUCT_PRO_ANNUAL`, `DODO_PRODUCT_BUSINESS_MONTHLY`, `DODO_PRODUCT_BUSINESS_ANNUAL`,
`DODO_ADDON_PACK_PRO_MONTHLY`, `DODO_ADDON_PACK_PRO_ANNUAL`, `DODO_ADDON_PACK_BUSINESS_MONTHLY`, `DODO_ADDON_PACK_BUSINESS_ANNUAL`.
`NEXTAUTH_URL` must be the live site URL (checkout and portal return URLs are built from it).
**Delete** the old `STRIPE_*` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` vars. Redeploy after changing env.

Database: run once against production Postgres: `npx prisma db push --accept-data-loss`
(drops the Stripe columns + StripeEvent table, adds dodo* columns + WebhookEvent; all users are Free, nothing paid is lost).

## 7. Test cards (test mode only; expiry 06/32, CVV 123)
- Success: Visa `4242 4242 4242 4242`, Mastercard `5555 5555 5555 4444`, India Mastercard `5409 1626 6938 1034`
- Decline: `4000 0000 0000 0002` (generic), `4000 0000 0000 9995` (insufficient funds)
- Renewal/upgrade failure: `4000 0000 0000 0341` (expiry 12/34) — succeeds first, then declines later charges

## 8. Test-mode checklist (verify before live)
1. Sign up → verify email → Upgrade to Pro monthly → pay with 4242 → back on dashboard the banner turns to "Payment confirmed. You're on Pro" and /plan shows Pro.
2. Add a site pack → charged now, billing date moves to today, pack count goes up.
3. Remove the pack → "removed at renewal"; Undo works.
4. Pro → Business upgrade (charged now); Business → Pro downgrade booked; **Keep Business** undoes it.
5. Monthly → Annual (charged now); Annual → Monthly booked for renewal; "Keep annual billing" undoes it.
6. Cancel → plan stays to period end; Resume undoes it. Cancel from the portal also shows up in-app.
7. Use card 0341, then trigger a renewal (Dodo: subscription → change next billing date to today, or wait) → on-hold
   banner appears; update the card in the portal → plan restored.
8. Billing history lists payments with invoice links.
9. Check the webhook log: every delivery 200, duplicates answered `duplicate: true`.
Things to confirm in test mode (Dodo behaviour we rely on): booked renewal changes (`do_not_bill`,
`next_billing_date`) apply at renewal and charge the new amount; metadata `userId` appears on the subscription;
payments expose an invoice URL. **Adaptive Currency**: leave off for now so prices match the USD on our site.

## 9. Go live
1. Switch the dashboard to **Live Mode**.
2. Recreate the 4 products and 4 add-ons exactly as above (live IDs are different), attach add-ons.
3. Create a **live** API key and a **live** webhook endpoint (same URL and events) → new signing secret.
4. Repeat Settings → Subscriptions portal settings in live mode.
5. In Vercel replace all 11 `DODO_*` values with the live ones, set `DODO_PAYMENTS_ENVIRONMENT=live_mode`, redeploy.
6. Do one real Pro monthly purchase with your own card, check the webhook log (200) and /plan, then cancel it
   (and refund yourself from the Dodo dashboard if you like).
