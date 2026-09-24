# Websites With Punch

**websiteswithpunch.com** — Website health SaaS MVP: uptime monitoring, SSL expiry, and domain expiry in one clean dashboard.

## Features

- **Uptime** — HTTP(S) checks, status history, up/down marking
- **SSL expiry** — certificate days remaining with warn thresholds
- **Domain expiry** — best-effort RDAP / WHOIS for the root domain
- **Dashboard** — list sites with status, last check, SSL days, domain days
- **CRUD** — add / edit / delete monitored sites
- **Auth** — email/password signup + login (NextAuth credentials)
- **Plans** — Free = 1 site; Pro = 10 sites at **$12/mo**; Business = 50 sites at **$42/mo**
- **Stripe-ready** — Checkout, Customer Portal, webhook route
- **Cron** — protected `/api/cron/check` to run all checks

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite (easy local demo)
- NextAuth.js (credentials)
- Stripe (optional locally)

## Quick start

```bash
git clone https://github.com/mardavsj/websiteswithpunch.git
cd websiteswithpunch
cp .env.example .env
npm install
npm run db:setup    # prisma db push + seed demo user
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo account (after seed)

| Field    | Value                         |
|----------|-------------------------------|
| Email    | `demo@websiteswithpunch.com`  |
| Password | `demo12345`                   |

Log in → Dashboard → **Recheck** on Example.com to populate uptime/SSL/domain fields.

## Environment variables

See `.env.example`. Required for local demo:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `CRON_SECRET`

Stripe vars are optional. Without them, the Upgrade CTA still appears; checkout/portal return a clear configuration error. Webhooks require `STRIPE_WEBHOOK_SECRET`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Generate Prisma client + production build |
| `npm run start` | Start production server |
| `npm run db:push` | Push Prisma schema to SQLite |
| `npm run db:seed` | Seed demo user + sample site |
| `npm run db:setup` | Push + seed |

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

## Stripe setup

1. Create Products + recurring Prices in Stripe Dashboard:
   - Pro **$12/mo** → `STRIPE_PRICE_ID_PRO` (or legacy `STRIPE_PRICE_ID`)
   - Business **$42/mo** → `STRIPE_PRICE_ID_BUSINESS` (create a new $42/mo Price; existing $39/mo subscribers can stay on their old Stripe price)
   - Pro pack **+$5 sites @ $6/mo** → `STRIPE_PRICE_ID_PACK_PRO`
   - Business pack **+$10 sites @ $9/mo** → `STRIPE_PRICE_ID_PACK_BUSINESS` (create a new $9/mo Price; existing $8/mo pack subscribers can stay on their old Stripe price)
2. Set `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. Forward webhooks locally:

   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

   Put the webhook signing secret in `STRIPE_WEBHOOK_SECRET`.

4. Events handled: `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.paid`, `invoice.payment_failed`.
5. Enable Customer Portal in Stripe settings for “Manage billing”. Prefer **not** allowing customers to edit subscription item quantities in the portal (packs are managed in-app with site-limit checks).

### Billing model (single subscription)

Each customer has **one** Stripe subscription with **one** renewal date:

- **Upgrades** (Free→Pro/Business, Pro→Business, pack add) take effect **immediately** (Stripe charges the rest of the current month when applicable).
- **Downgrades & cancel** take effect at **period end**: Business→Pro and cancel use `proration_behavior: none` / `cancel_at_period_end` so the bill drops next renewal with no refund. The user keeps their current site limit until then.
- **Site packs** are line items on the same subscription. Removing a pack lowers Stripe quantity now (`proration_behavior: none`) but the paid-through pack count stays until renewal; over-limit sites are then **locked** (not deleted, not monitored).
- **Site locking**: active (unlocked) sites count toward the limit. Locked sites keep history but skip cron checks; APIs hide metrics (`SITE_LOCKED`). Before a scheduled reduction takes effect, users can change which sites stay active as often as they like; after it applies, active sites are fixed — free a slot by deleting an active site, then add a new site or unlock a locked one. If no keep-selection was made, the oldest stay active.
- **Cancel / Resume** are in-app (`cancel_at_period_end`). Portal cancels are mirrored via webhook. **past_due** keeps sites active (grace) with a dashboard banner.
- Webhooks are idempotent: derive plan/packs from Stripe, apply due pending changes, then `enforceSiteLimit`.
- Prefer **Customer Portal** settings: allow cancel at period end; **disable** plan switching and quantity edits in the portal (handled in-app with keep-site pickers).

Without Stripe keys the product still demos fully for Free-plan monitoring.

## Deploy notes (websiteswithpunch.com)

1. Host on Vercel (or similar) with Node runtime.
2. Set all env vars; use a durable database in production (swap Prisma datasource to Postgres when you leave the demo SQLite file).
3. Set `NEXTAUTH_URL=https://websiteswithpunch.com`.
4. Point Stripe webhook to `https://websiteswithpunch.com/api/stripe/webhook`.
5. Schedule cron against `/api/cron/check` with `CRON_SECRET`.
6. Ensure `/privacy` and `/terms` remain publicly reachable (Stripe review).

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
