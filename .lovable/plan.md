# Getting Printreon to a complete, testable platform

## Where things stand

Confirmed from the database and code:

- 6 users exist, 3 published creators, 6 tiers, 6 files, 2 creator posts, 15 beta pre-registrations.
- 0 subscriptions and 0 downloads have ever been created — the paid path has never been exercised end to end.
- 0 emails in the outbox; sending needs a verified sender domain, so notification emails are queued-only today.
- The dev quick-login panel and the "simulate subscribe" button were removed during the landing-page redesign. `src/functions/dev.functions.ts` still contains the seeding/simulate logic but nothing in the UI calls it.
- The site is in waitlist mode: the header has no navigation, so `/explore`, `/auth`, `/pricing` are reachable only by typing the URL.

## Login details (existing accounts)

Sign-in page: **https://printreon.com/auth** · Admin panel: **https://printreon.com/admin**

| Role | Email | Password |
| --- | --- | --- |
| Admin (yours) | mattoftaylor@gmail.com | Iv8xkxi44!! |
| Demo creator | creator@demo.printreon.test | DemoPass123! |
| Demo supporter | buyer@demo.printreon.test | DemoPass123! |
| Demo admin | admin@demo.printreon.test | DemoPass123! |

The three demo passwords were last set by the seeding function. Part of this plan is re-running the reset so they are guaranteed to work, then confirming each login by actually signing in.

## What I'll do

### 1. Restore the test harness
- Bring back the quick-login buttons on `/auth` (buyer / creator / admin), shown only outside the live domain or behind a `?dev=1` flag so real visitors never see them.
- Re-run account seeding so the three demo passwords are known-good, and confirm the demo creator page has published tiers, files and a post.
- Restore the "simulate subscribe" action on a creator page so a supporter can get an active subscription without Stripe. This is what unblocks testing downloads, the supporter dashboard, creator subscriber lists and analytics.

### 2. Walk every flow and fix what breaks
Driving the real preview in a browser, signed in as each role:

- Visitor: landing → beta form submit → explore → creator page → pricing/help/blog/legal.
- Supporter: sign up, sign in, Google sign-in, subscribe (simulated), downloads, wishlist, following, print log, messages, notifications, settings, cancel subscription.
- Creator: onboarding, profile publish, tiers, file upload, posts, announcements, bundles, promos, subscribers, analytics, payouts screen, share link.
- Admin: users, creators, memberships, payments, pre-registrations + CSV, invites, support, feature flags, activity log, system health.

Each broken screen gets fixed in the same pass; I'll report a checklist of what passed and what I changed.

### 3. Close the real gaps
- **Navigation**: add a small nav (Explore / Pricing / Sign in) so the platform is usable, while keeping the waitlist as the landing hero. Confirm with you before changing the hero itself.
- **Cancel / expiry**: add the scheduled job that revokes access when a cancelled subscription's period ends — today nothing runs at period end.
- **Email**: notification emails stay queued until a sender domain is verified. I'll wire the verified-domain setup when you're ready, and until then make failures visible in admin instead of silent.
- **Empty states**: explore and creator pages need a sensible state while only demo creators exist.

### 4. Left for you (not blocking)
- Stripe Connect + live keys (you've said you'll do this).
- Choosing the sender domain for emails.

## Technical notes

- Quick-login and simulate-subscribe are guarded server-side, not just hidden in the UI, so they can't be triggered on the live domain.
- Period-end revocation will run as a public cron endpoint under `src/routes/api/public/` with a shared-secret check, since Stripe webhooks won't fire while payments are in test mode.
- No schema changes are expected beyond an index or two; the tables for subscriptions, downloads and the email outbox already exist.
