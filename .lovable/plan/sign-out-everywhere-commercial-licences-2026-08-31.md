# Sign out everywhere + Commercial licences

## 1. Sign out is missing for supporters and creators

Today sign out only exists on `/me/settings` and in the admin sidebar. Fix it at the header so it is present on every signed-in page.

- Replace the "My account" button in the site header with an account menu (avatar/email trigger) containing: My account, Creator studio (when the user has a creator profile), Admin (when admin), and Sign out.
- Add the same entries to the mobile menu sheet.
- Sign out flow: cancel in-flight queries, clear cached data, `supabase.auth.signOut()`, then navigate to `/` with history replace.

## 2. Commercial licences (per tier, live from subscription)

Rights come from the tier a supporter is subscribed to. A licence is valid while the qualifying subscription is active.

**Creator side — `/dashboard/licences`**
- Config: for each tier, toggle "Includes commercial licence", set a licence summary (what is allowed), optional limits (e.g. max units sold per year, attribution required), and optional custom licence terms text.
- Issued list: every supporter currently holding a commercial licence through one of those tiers — name/email, tier, active since, status. CSV export.
- The tier editor on `/dashboard/tiers` gets a "Commercial licence" toggle too, with a link across to the licences page for the full terms.

**Supporter side — `/me/licences`**
- Lists each active subscription and states clearly: Commercial licence included, or Personal use only.
- For commercial tiers: a printable licence certificate showing licensee name, creator, tier, licence terms, scope/limits, valid-from date and current status (active / ends on date if cancelling).
- Non-commercial subscriptions still show, marked "Personal use only", so the distinction is obvious.

**Public side**
- Creator profile tier cards show a "Commercial licence" badge when the tier includes it, so buyers know before subscribing.
- `/me/receipts` licence wording becomes conditional: personal-use text unless the download was under a tier flagged commercial (checked live against the current subscription), in which case it shows the commercial terms.

## Technical notes

Migration on `creator_tiers` (all additive, nullable/defaulted):
- `commercial_licence boolean not null default false`
- `commercial_licence_summary text`
- `commercial_licence_terms text`
- `commercial_units_limit integer`
- `commercial_attribution_required boolean not null default false`

No new table: entitlement is derived from `subscriptions` (status active) joined to `creator_tiers.commercial_licence`. Existing tier RLS/grants already cover reads; tier updates stay creator-owned.

New files: `src/routes/dashboard.licences.tsx`, `src/routes/me.licences.tsx`, plus nav entries in `DashboardNav.tsx` and `MemberNav.tsx`. Issued-licence list for creators reads through an authenticated server function so supporter emails are never exposed to other members. Header menu changes live in `SiteChrome.tsx`.
