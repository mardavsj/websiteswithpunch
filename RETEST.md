# Batch 13: production db push, reconcile and Dodo test-mode retest

The box has no production credentials, so I could NOT do any of these from here:
- run `prisma db push` on Neon
- reconcile sub_0NpLLS9zSUj1lobmjYZ2v

What's missing:
- No Vercel CLI login on the box (no `vercel` binary, no ~/.vercel).
- No Neon credentials and no neonctl.
- No production DATABASE_URL anywhere. The repo's .env and .env.local both point at localhost.
- No DODO_PAYMENTS_API_KEY anywhere on the box.

## 0. Deploy the code first
Apply launch12 (the sync fix) and launch13 (reconcile script) to `main` and let Vercel deploy. Batch 12 has no schema changes.

## 1. Production db push (on the user's own computer)
    cd websiteswithpunch
    npx vercel login && npx vercel link        # pick the websiteswithpunch project
    npx vercel env pull .env.production.local --environment=production
    npx dotenv-cli -e .env.production.local -- npx prisma db push
    # (or: export the DATABASE_URL and DIRECT_URL values from that file, then npx prisma db push)

- Add `--accept-data-loss` only if Prisma warns about dropping the old Stripe columns (stripeCustomerId etc.). Those are unused since Batch 10.
- Expected: User gets dodoCustomerId, dodoSubscriptionId, dodoStatus and dodoSyncedAt (if missing). Site gets sslInfo and domainInfo (Json?). WebhookEvent exists.
- Then delete .env.production.local. It is gitignored, but it holds secrets.

Check it worked (Neon SQL editor):
    SELECT column_name FROM information_schema.columns WHERE table_name='User' AND column_name LIKE 'dodo%';
    SELECT column_name FROM information_schema.columns WHERE table_name='Site' AND column_name IN ('sslInfo','domainInfo');

## 2. Reconcile the stuck user (pick one)
- a) After deploying: `npx tsx --env-file=.env.production.local scripts/reconcile-dodo.ts sub_0NpLLS9zSUj1lobmjYZ2v`. It prints the plan in Dodo plus the before/after plan; the after plan should be business.
- b) After deploying: sign in as the test user and open /dashboard. The summary self-heal switches the plan to Business and refreshes the page.
- c) SQL, with no deploy needed:
     UPDATE "User" SET plan='business', "sitePackCount"=0, "dodoStatus"='active',
       "dodoSubscriptionId"='sub_0NpLLS9zSUj1lobmjYZ2v', "cancelAtPeriodEnd"=false,
       "pendingPlan"=NULL, "pendingPlanAt"=NULL, "pendingSitePackCount"=NULL,
       "pendingPackChangeAt"=NULL, "dodoSyncedAt"=NULL
     WHERE email='<test user email>';

## 3. Dodo dashboard settings (Test mode)
- Turn **Adaptive Currency OFF** (Settings → Payments / Adaptive pricing). Prices are USD; INR conversion makes Indian test cards fail. Checkout now also sends billing_currency=USD and hides the currency picker.
- Webhook endpoint `https://www.websiteswithpunch.com/api/webhooks/dodo`, events `subscription.*`, `payment.succeeded`, `payment.failed`. Vercel must have DODO_PAYMENTS_API_KEY set, because the webhook now re-reads every subscription through the API. Without the key every event returns 500 and Dodo retries.

## 4. UI retest (parent / computerUse, test cards only, Dodo TEST mode)
Use test card 4242 4242 4242 4242, any future expiry, any CVC. Expected totals include 18% tax.

| # | Step | Expected |
|---|------|----------|
| 1 | Sign up with a new email → verify the email → choose Pro monthly → checkout | Checkout shows USD with no currency picker. The subtitle on /signup reads "You'll verify your email, then pay securely on Dodo Payments." |
| 2 | Pay $14.16 | Back on /dashboard?checkout=done you see "Pro · 0/15" within about 1 min |
| 3 | Plan → Add site pack | Charged $7.08. Within about 6 min the limit goes up (the UI keeps polling) |
| 4 | Upgrade to Business | Prorated charge. Within about 6 min it shows Business. If the tab is closed, reopening /dashboard heals it. Upgrading again says "already on Business" only when the DB is already Business |
| 5 | Switch to annual | Prorated charge, then the interval shows Yearly |
| 6 | Switch to Pro (downgrade) | Nothing charged. Banner says "Switching to Pro on <renewal date>" |
| 7 | Cancel, then Resume | Banner says "Your plan ends on …", and Resume clears it |
| 8 | Manage billing portal | Opens the Dodo portal; cancelling there mirrors via the webhook |
| 9 | Dodo → Webhooks → Logs | Every delivery is 200. Note any 500 (it means the API key is missing or the read failed) |
| 10 | Failed card 4000 0000 0000 0002 on upgrade | Plan unchanged, error shown, nothing charged |

Light and dark themes, at 360px width: spot-check /plan and the dashboard header after steps 3 and 4.
