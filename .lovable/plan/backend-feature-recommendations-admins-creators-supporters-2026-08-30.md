# Backend feature recommendations — admins, creators, supporters

Based on what's actually in the build today: the front-of-house surfaces are broad
(18 admin pages, 13 creator pages, 11 supporter pages), but several backend
systems behind them are thin or missing. These are the gaps worth closing,
ordered by impact.

## Tier 1 — needed before real money moves

**1. Earnings ledger (creators + admins)**
There is no table recording individual payments. Payout figures are inferred
from active subscriptions, so refunds, failed charges, fees and historical
months can't be shown accurately. Add a `payment_events` ledger written by the
Stripe webhook (gross, platform fee, net, currency, period, status) and drive
the creator payouts page and admin payments page from it.

**2. Webhook coverage for invoices and disputes**
The webhook currently handles subscription created/updated/deleted and Connect
`account.updated` only. Missing: `invoice.payment_succeeded` (ledger rows),
`invoice.payment_failed` (dunning), `charge.refunded` and `charge.dispute.created`
(reversals). Without these, a failed renewal silently keeps access.

**3. Dunning / failed-payment flow (supporters)**
On a failed charge: mark the subscription `past_due`, email the supporter with
an update-card link, retry window, then revoke. Today a failure is invisible to
everyone.

**4. Refund + subscription actions in admin**
Admin can view memberships but can't act. Add: refund last payment, cancel a
subscription immediately, grant complimentary access — each written to
`admin_activity_log`.

## Tier 2 — trust, safety and operations

**5. Moderation queue (admins)**
`admin_reports` exists in the database with no UI at all, and `comments.is_hidden`
has no admin path. Build `/admin/reports`: triage reported files, creators and
comments; actions to hide, unpublish, warn or suspend, all logged.

**6. Creator suspension / file takedown state**
Currently a creator is either published or not. Add explicit `suspended` state
plus DMCA takedown status on files (the DMCA legal page promises a process that
the backend can't execute), and block payouts while suspended.

**7. Email deliverability view (admins)**
`email_outbox` records status and errors but nothing surfaces them. Add an admin
view with retry, so failed beta invites and new-file notifications aren't lost
silently. Also move the sender off `onboarding@resend.dev` to a verified
printreon.com domain.

**8. Download abuse controls (creators + supporters)**
Signed download URLs are issued with no rate limit. Add per-user hourly limits,
IP/device counting and a creator-visible "suspicious activity" signal, plus
optional watermarking of the licence text inside ZIP bundles.

## Tier 3 — growth and retention

**9. Creator revenue analytics**
Backed by the new ledger: MRR, churn %, new vs lost supporters per month,
lifetime value per supporter, top-earning tiers. Currently analytics is counts
only.

**10. Annual plans and free trials on tiers**
Schema stores a single monthly price per tier. Add interval + optional annual
price and trial days — the single biggest lever on supporter LTV.

**11. Search and discovery backend**
Explore filters client-side over a small set. Add Postgres full-text search
across files, tags, creators and materials with a materialised trending score
(downloads + new supporters over 7 days).

**12. Supporter licence receipts**
Per-download licence records (personal vs commercial) with a downloadable PDF/
text receipt — directly supports the commercial-licensing interest captured in
the beta form.

**13. Scheduled publishing worker**
`creator_files.scheduled_at` and `creator_posts.scheduled_at` exist but nothing
flips them live. Extend the cron endpoint to publish due items and fire
follower notifications.

## Technical notes

- New tables: `payment_events`, `file_reports` actions on existing
  `admin_reports`, `download_events`, `licences`. All in `public` with GRANTs +
  RLS scoped to owner/creator/admin.
- Ledger writes happen only in the verified Stripe webhook and the cron route,
  using the service-role client after signature verification.
- Cron work (dunning sweep, scheduled publishing, trending refresh) extends the
  existing `/api/public/cron/*` pattern guarded by `CRON_SECRET`.
- Tier-1 items 1–3 are prerequisites for accurate payouts, so they should land
  before Stripe Connect goes live.

## Suggested first step

Ship Tier 1 as one unit (ledger + webhook events + dunning + admin actions),
since they share the same webhook and table work.
