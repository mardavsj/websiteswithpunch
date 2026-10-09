# Fixing the stuck test user (sub_0NpLLS9zSUj1lobmjYZ2v)

I couldn't do this from the box: there's no DODO_PAYMENTS_API_KEY there, and DATABASE_URL points to a local database, not Neon.

## Option A: after redeploying Batch 12 (recommended)
Sign in as that user and open /dashboard or /plan. /api/billing/summary reads the live subscription, sees Pro vs Business and syncs it. The page then refreshes and shows Business.
Another way, in the browser console while signed in:
  fetch('/api/billing/sync',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subscriptionId:'sub_0NpLLS9zSUj1lobmjYZ2v'})}).then(r=>r.json()).then(console.log)

## Option B: resend the webhook (also needs the new code deployed)
Dodo dashboard (Test mode) → Developer → Webhooks → your endpoint → Logs → pick the subscription.plan_changed / payment.succeeded event for sub_0NpLLS9zSUj1lobmjYZ2v → Resend.
The old code would mark it "stale" and ignore it again.

## Option C: SQL on Neon (works right away, no deploy)
UPDATE "User" SET plan='business', "sitePackCount"=0, "dodoStatus"='active',
  "dodoSubscriptionId"='sub_0NpLLS9zSUj1lobmjYZ2v', "cancelAtPeriodEnd"=false,
  "pendingPlan"=NULL, "pendingPlanAt"=NULL, "pendingSitePackCount"=NULL, "pendingPackChangeAt"=NULL,
  "dodoSyncedAt"=NULL
WHERE email='<test user email>';
Setting "dodoSyncedAt"=NULL matters if you stay on the OLD code: it stops later events being dropped as stale.
