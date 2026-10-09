# Websites With Punch

**websiteswithpunch.com** — Website health SaaS MVP: uptime monitoring, SSL expiry, and domain expiry in one clean dashboard.

## Features

- **Uptime** — HTTP(S) checks, status history, up/down marking
- **SSL expiry** — certificate days remaining with warn thresholds
- **Domain expiry** — best-effort RDAP / WHOIS for the root domain
- **Dashboard** — list sites with status, last check, SSL days, domain days
- **CRUD** — add / edit / delete monitored sites
- **One site = one host** — www and paths count as the same site; other subdomains are separate
- **Auth** — email/password signup + login (NextAuth credentials), password reset by email (Resend)
- **Plans** — Free = 1 site; Pro = 10 sites at **$12/mo**; Business = 50 sites at **$42/mo**
- **Billing via [Dodo Payments](https://dodopayments.com)** (merchant of record) — hosted checkout, customer portal, signed webhook
- **Cron** — protected `/api/cron/check` to run all checks

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Prisma + PostgreSQL (e.g. [Neon](https://neon.tech))
- NextAuth.js (credentials)
- Dodo Payments (optional locally)

## Quick start

```bash
git clone https://github.com/mardavsj/websiteswithpunch.git
cd websiteswithpunch
cp .env.example .env   # then set DATABASE_URL to your Postgres / Neon connection string
npm install
npm run db:setup    # prisma db push + seed demo user
npm run dev
```

You need a PostgreSQL database. A free [Neon](https://neon.tech) project works: copy its
connection string (Connect → keep `?sslmode=require`) into `DATABASE_URL`. A local Postgres
works too, e.g. `postgresql://postgres:postgres@localhost:5432/wwp`.

Open [http://localhost:3000](http://localhost:3000).

### Demo account (after seed)

| Field    | Value                         |
|----------|-------------------------------|
| Email    | `demo@websiteswithpunch.com`  |
| Password | `demo12345`                   |

Log in → Dashboard → **Recheck** on Example.com to populate uptime/SSL/domain fields.

## Environment variables

See `.env.example`. Required for local demo:

- `DATABASE_URL` (PostgreSQL connection string)
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `CRON_SECRET`

`DODO_*` vars are optional. Without them, the Upgrade CTA still appears; checkout/portal return a clear configuration error. Webhooks require `DODO_PAYMENTS_WEBHOOK_KEY`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Generate Prisma client + production build |
| `npm run start` | Start production server |
| `npm run db:push` | Create/update tables in the Postgres database (`prisma db push`) |
| `npm run db:seed` | Seed demo user + sample site |
| `npm run db:setup` | Push + seed |
| `npm test` | Unit tests (webhook signature, plan mapping, site details) |
| `npm run indexnow` | Optional, after a deploy: ping IndexNow (Bing etc.) with every sitemap URL, or `npm run indexnow -- /path` for specific pages. Needs `public/<key>.txt` live first |

## Cron / scheduled checks

Protect the route with `CRON_SECRET`:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/check
```

Or:

```bash
curl -H "x-cron-secret: $CRON_SECRET" \
  http://localhost:3000/api/cron/check
```

On Vercel, add a Cron Job hitting `/api/cron/check` with the secret header. Elsewhere use systemd timer, GitHub Actions, or EasyCron.

## Dodo Payments setup

Full dashboard walkthrough (test mode first, then live): see `DODO_SETUP.md` in the launch notes. In short:

1. **Developer → API Keys**: create a key → `DODO_PAYMENTS_API_KEY`; set `DODO_PAYMENTS_ENVIRONMENT` to `test_mode` or `live_mode`.
2. **Products** (subscription, tax category SaaS), one per plan × interval:
   - Pro **$12/mo** / **$120/yr** → `DODO_PRODUCT_PRO_MONTHLY` / `DODO_PRODUCT_PRO_ANNUAL`
   - Business **$42/mo** / **$420/yr** → `DODO_PRODUCT_BUSINESS_MONTHLY` / `DODO_PRODUCT_BUSINESS_ANNUAL`
3. **Add-ons** (site packs), attached to the matching product:
   - Pro pack **+5 sites @ $6/mo** / **$60/yr** → `DODO_ADDON_PACK_PRO_MONTHLY` / `_ANNUAL`
   - Business pack **+10 sites @ $9/mo** / **$90/yr** → `DODO_ADDON_PACK_BUSINESS_MONTHLY` / `_ANNUAL`
4. **Developer → Webhooks**: endpoint `https://www.websiteswithpunch.com/api/webhooks/dodo`, events `subscription.*`, `payment.succeeded`, `payment.failed`. Signing secret → `DODO_PAYMENTS_WEBHOOK_KEY`.
5. Customer portal: allow cancel at next billing date only; plan changes stay in-app.

### Billing model (single subscription)

Each customer has **one** Dodo subscription (product = plan + interval, add-on quantity = packs) with **one** renewal date:

- **Free → paid** goes through Dodo hosted checkout; the webhook sets the plan (the dashboard also polls `/api/billing/sync` on return).
- **Upgrades** (Pro→Business, monthly→annual, pack add) charge now with `prorated_immediately`: the unused part of the current period is credited and the billing date moves to today. `on_payment_failure: prevent_change` means nothing changes if the charge fails.
- **Downgrades** (Business→Pro, pack removal, annual→monthly) are booked for the next billing date with `do_not_bill`: no refund, current limits stay until then. Only one scheduled change exists at a time.
- **Cancel / Resume** are in-app (`cancel_at_next_billing_date`). Portal cancels are mirrored via webhook.
- **Status**: `active` and `past_due` (Dodo retry grace) keep the paid plan; `on_hold`, `cancelled`, `expired` and `failed` drop to Free. `on_hold` shows an "update your payment method" banner linking to the portal.
- **Site locking**: active (unlocked) sites count toward the limit. Locked sites keep history but skip cron checks; APIs hide metrics (`SITE_LOCKED`). Before a scheduled reduction takes effect, users can change which sites stay active; if no keep-selection was made, the oldest stay active.
- Webhooks are signature-verified (Standard Webhooks) and deduplicated by `webhook-id`; each subscription/payment event re-reads the subscription from the Dodo API (so event order doesn't matter), then `enforceSiteLimit` runs. `/api/billing/summary` also re-syncs if the stored plan drifts from Dodo.
- Checkout forces USD (`billing_currency: "USD"`, no currency picker). Keep **Adaptive Currency off** in Dodo.

Without Dodo keys the product still demos fully for Free-plan monitoring.

## Deploy notes (websiteswithpunch.com)

1. Host on Vercel (or similar) with Node runtime.
2. Set all env vars, including `DATABASE_URL` for your production Postgres (Neon), then run `npx prisma db push` once against it (and again after schema changes).
3. Set `NEXTAUTH_URL=https://websiteswithpunch.com` (password reset links are built from it). Set `RESEND_API_KEY` so reset emails are sent; `AUTH_FROM_EMAIL` is optional and defaults to `CONTACT_FROM_EMAIL`.
4. Point the Dodo webhook to `https://www.websiteswithpunch.com/api/webhooks/dodo`.
5. Schedule cron against `/api/cron/check` with `CRON_SECRET`.
6. Ensure `/privacy` and `/terms` remain publicly reachable (payment provider review).

## Plan limits

| Plan     | Sites | Price  |
|----------|-------|--------|
| Free     | 1     | $0     |
| Pro      | 10    | $12/mo |
| Business | 50    | $42/mo |

Optional site packs (from the dashboard, on the same subscription): Pro +5 sites for $6/mo (max 4 packs, 30 sites); Business +10 sites for $9/mo (max 5 packs, 100 sites). Need more than 100? Contact [hello@websiteswithpunch.com](mailto:hello@websiteswithpunch.com). Enforced server-side when creating sites.

## Lockfile

`package-lock.json` is generated by `npm install`. If it is not present in the clone, run `npm install` once to create it before building.

## License

Private / proprietary — mardavsj / Websites With Punch.
