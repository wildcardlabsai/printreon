# Pre-launch review — final recommendations before announcing the beta

I went through the live data, security scan, landing page, navigation, dashboards and admin panel. The build is in good shape. Below is what I'd fix before you announce, grouped by how much it matters.

## 1. Must fix before announcing (data exposure)

The security scan flags three real issues that are live right now:

- **All user email addresses are publicly readable.** The `profiles` read policy allows anyone (including signed-out visitors) to read every user's email, name and avatar. Fix: expose only public fields through a public view / narrowed policy, keep email to the owner and admins.
- **Paid file details leak to non-subscribers.** The `creator_files` read policy exposes `file_url` for published files without checking tier or subscription — so a paid file's URL can be read by someone who hasn't paid. The UI gates it, the database doesn't. Fix: policy checks owner OR free OR active subscriber to the required tier. Same fix for `file_versions` (currently `USING (true)`) and `bundle_files`.
- **Invite codes are fully enumerable.** Anyone can read every invite code plus the invited email. Fix: allow lookup only of a specific code being redeemed, via a security-definer redeem function.

Also tighten the storage delete policy to a specific bucket (currently only checks the user folder).

## 2. Clean up test data before you announce

- **Remove the temporary "Live payment test (£1)" tier** on Demo Creator Studio — it's still active and publicly subscribable.
- **Decide what to do with demo/placeholder creators.** Five creator pages are published: Demo Creator Studio (4 seeded files), Tester, PokeCraft, Keyper Prints, Printopia. New visitors landing on `/explore` will see these. Recommendation: unpublish or rename the obvious test accounts (Demo Creator Studio, Tester), keep only ones you're happy to show.
- Confirm dev tools stay hidden: quick-login and simulate-subscribe are host-gated to non-live domains, which is correct — no change needed.

## 3. Launch-day polish (recommended, low risk)

- **Landing page nav** currently mixes anchor links (Features, Founder Benefits, Become a Creator) with Explore/Pricing. Now the beta is open, lead the nav with **Explore creators** and **Become a creator**, and demote the founder-benefits anchor.
- **Above-the-fold CTA**: the hero scrolls to the beta form. Since supporters can sign up immediately, add a direct "Browse creators" secondary CTA so buyers aren't funnelled into an application form.
- **Empty-state for `/explore`** if you unpublish demo creators — make sure it reads as "creators arriving daily", not a broken page.
- **Currency consistency**: tiers exist in both USD and GBP. Decide on a default display currency for the platform and note it on pricing pages so supporters aren't surprised at checkout.
- **Creator payout onboarding nudge**: no creator has completed Stripe Connect onboarding yet. Add a persistent banner on the creator dashboard blocking "publish paid tier" until Connect onboarding is done — otherwise money accumulates in your platform balance and creators get confused.

## 4. Design and feel

The current maker aesthetic (acid lime, Instrument Serif, bento grid, dark ink sections) is distinctive and holds up — I would not redesign before launch. Two small consistency items:

- Dashboard and admin surfaces are noticeably plainer than the marketing site. Carry the accent colour and mono eyebrow labels into the dashboards so the product feels like the same brand.
- Check the mobile view of the admin panel and creator earnings tables — wide tables are the most likely place to break on a phone.

## 5. Operational checks before the announcement

- Confirm the live Stripe webhook endpoint is registered against the live domain (test payment worked, so this looks fine — worth a re-confirm).
- Verify the expire-subscriptions cron is scheduled and has run at least once.
- Send one real welcome + receipt email end to end from `notify.printreon.com` and confirm inbox placement (not spam).
- Re-run the security scan after the policy fixes so the launch starts clean.

## Technical notes

Policy work is a single migration touching `profiles`, `creator_files`, `file_versions`, `bundle_files`, `invite_codes` and `storage.objects`. Any place the app currently reads `profiles.email` client-side will need to move to the owner/admin path or a server function. Frontend changes are limited to `SiteChrome.tsx`, `src/routes/index.tsx`, `src/routes/explore.tsx` and the creator dashboard banner.

## Suggested order

1. Security policy migration + re-scan
2. Remove £1 test tier, tidy demo creators
3. Nav/CTA/empty-state polish + Connect onboarding banner
4. Email + cron + webhook confirmation
5. Announce
