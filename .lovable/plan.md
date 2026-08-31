# Getting Stripe live, then fully launching Printreon

## Where payments stand today

Confirmed in the project:

- The app is wired to Stripe test mode — the browser token in the preview environment is a `pk_test_` key, so every checkout today is a sandbox transaction.
- Checkout (embedded), subscription create/cancel/resume, upgrade/downgrade, the earnings ledger and Stripe Connect express onboarding are all implemented in code.
- The webhook endpoint exists at `/api/public/payments/webhook` with signature verification.
- Server code reads `STRIPE_SANDBOX_API_KEY` / `STRIPE_LIVE_API_KEY` and `PAYMENTS_SANDBOX_WEBHOOK_SECRET` / `PAYMENTS_LIVE_WEBHOOK_SECRET`, so live keys slot in without code changes.
- Two cron endpoints exist (`expire-subscriptions`, `publish-scheduled`) guarded by `CRON_SECRET`, but no schedule is registered to call them.

So the build is code-complete for payments; what remains is account verification and switching the environment over.

## Part 1 — Steps to get Stripe live (your actions)

1. **Test the full paid flow in sandbox first.** Sign in as the demo supporter, subscribe to a demo creator tier using Stripe's test card `4242 4242 4242 4242`, then check: the subscription appears in `/me/subscriptions`, gated files unlock, the payment shows in `/admin/payments` and `/admin/revenue`, and cancelling leaves access until period end. Tell me anything that misbehaves and I'll fix it.
2. **Claim your Stripe sandbox account.** In the Payments section of the project settings, open the Stripe account and complete the claim so the account is yours rather than a throwaway sandbox.
3. **Submit the Stripe go-live form.** Business details, bank account, identity verification. Approval is Stripe's, not mine — usually same day, occasionally a few days.
4. **Install the Lovable app on the live Stripe account** when prompted during go-live, so the live account can be reached the same way the sandbox is.
5. **Provision live keys.** Once approved, the live API key and live webhook secret get stored as `STRIPE_LIVE_API_KEY` and `PAYMENTS_LIVE_WEBHOOK_SECRET`, and the browser token switches to the live publishable key. No code edit needed — the environment is derived from the token.
6. **Recreate your real products/prices in live mode.** Sandbox tiers do not carry over. Your creator tiers need live prices created before anyone can subscribe.
7. **Point the live webhook at production**: `https://printreon.com/api/public/payments/webhook`, subscribed to the invoice, subscription and charge/dispute events the handler already covers.
8. **Do one real £1 transaction** on the live site with your own card, confirm it lands in the ledger and admin views, then refund it.

## Part 2 — What I do around the switch

- Add a **Stripe readiness check** in the admin panel that shows, at a glance, which keys are present, which environment is active, and whether the webhook has ever received a verified event — so you are not guessing whether live is really live.
- **Register the two cron jobs** so `expire-subscriptions` (revoke access at period end) and `publish-scheduled` (scheduled posts/files) actually run, instead of only existing as endpoints.
- **Lock the test harness out of production**: quick-login and simulate-subscribe are already domain-guarded; I'll re-verify server-side so they can't fire on the live domain once real money is involved.
- Handle **failed payment / dunning UI** for supporters: a clear banner and a "update card" path when an invoice fails, rather than silent loss of access.

## Part 3 — Remaining blockers to being fully live (beyond Stripe)

- **Creator payouts**: Stripe Connect onboarding is built, but each creator must complete express onboarding before they can be paid. Nothing pays out until the connected account is `active`.
- **Email sending**: notification and beta emails are queued but not delivered — this needs a verified sender domain (e.g. `mail.printreon.com`) set up. Until then supporters get no receipts, no new-file alerts, no password-reset styling.
- **Legal pages**: terms, privacy, creator agreement and DMCA exist; they should be reviewed against taking real money and paying creators before launch.
- **Security findings**: the outstanding items in the Security view should be cleared before public launch.

## Technical notes

- Environment selection is derived from the publishable token prefix in `src/lib/stripe.ts`; server calls take the matching secret via `src/lib/stripe.server.ts`. Nothing hardcodes sandbox.
- Cron endpoints live under `src/routes/api/public/cron/` and authenticate with the `x-cron-secret` header against `CRON_SECRET`; scheduling will use the stable production URL so it survives renames.
- No schema changes are needed for go-live; `payment_events`, `subscriptions` and `creator_profiles.connected_account_id` already cover live traffic.

## Suggested order

Sandbox end-to-end test → Stripe claim + go-live form → live keys + live prices + webhook → readiness check and cron scheduling → email domain → launch.
