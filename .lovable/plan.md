# Creator earnings dashboard

You already have a creator studio at `/dashboard` — no admin access needed — covering Overview, Files, Posts, Bundles, Promo codes, Tiers, Licences, Subscribers, Messages, Analytics, Announcements, Payouts and Settings. Files, subscriptions and payouts are already there.

The one real gap is **money**: sales and earnings history only exists in the admin revenue view today. Creators can see MRR and subscriber counts, but not what they've actually earned, when, and what's been deducted.

## What gets added

**New page: Earnings (`/dashboard/earnings`)**

- Headline cards: earned this month, earned last month, lifetime net earnings, pending (this period, not yet paid out).
- Monthly earnings bar chart for the last 12 months.
- Gross → platform fee → processing fee → net breakdown, so the take-home number is never a surprise.
- Transactions table: date, member, tier, gross, fees, net, status (paid / refunded / failed). Filterable by date range, exportable to CSV for bookkeeping.
- Failed-payment row highlighting so a creator can see churn risk from dunning, not just cancellations.

**Overview page gets a money row**

Adds "Earned this month" and "Lifetime earnings" alongside the existing MRR / subscribers / files / followers stats, each linking through to the Earnings page.

**Payouts page gets history**

The existing page shows Stripe Connect status and projected monthly net. It gains an actual payout history list (amount, date, arrival status) pulled from the connected account, plus a clear "next payout" line.

**Analytics gets a revenue line**

The 30-day activity chart currently plots downloads and new subs. Revenue per day is added as a second series so spikes in downloads can be read against spikes in income.

## Notes

- Everything is scoped to the signed-in creator's own data — no admin role involved.
- While payments are still in Stripe test mode, these pages will show test-mode figures; they switch to real numbers automatically at go-live with no further changes.

## Technical detail

- Data source is the existing `payment_events` table, which already has a `Creators read own payment events` RLS policy scoped through `creator_profiles.user_id = auth.uid()` — no schema or policy change needed.
- New `src/functions/earnings.functions.ts` with `requireSupabaseAuth`-protected server functions: `creatorEarningsSummary` (monthly rollups + lifetime totals) and `creatorEarningsTransactions` (paged, filtered ledger). Aggregation happens server-side so the browser never pulls the full event history.
- New route `src/routes/dashboard.earnings.tsx`, registered in `DashboardNav` between Subscribers and Messages.
- Payout history comes from a new `listConnectPayouts` server function in the existing `connect.functions.ts`, calling the Stripe Connect payouts API for the creator's connected account.
- `dashboard.index.tsx` and `dashboard.analytics.tsx` are extended to call the same summary function rather than duplicating aggregation logic.
