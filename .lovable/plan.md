# Email setup for printreon.com

No mailbox for now. Two things to arrange:

1. **Inbound** — anything a visitor submits (contact, feedback, beta applications) lands in your Gmail at mattoftaylor@gmail.com.
2. **Outbound** — everything Printreon sends comes from your own domain, so it reads as `Printreon <hello@printreon.com>` rather than a generic sender.

## Part 1 — Sender domain (one DNS step from you)

I'll kick off the email setup dialog. It gives you one set of NS records to paste into Namecheap (Domain List > printreon.com > Advanced DNS) for a `notify.printreon.com` subdomain. Lovable then manages SPF/DKIM/MX inside that subdomain only — your root domain records are untouched, so adding a mailbox later is still easy.

Once DNS verifies, sending is live.

## Part 2 — Outbound emails I'll build

All branded to match the site (acid-lime accents, Instrument Serif headings), all from your domain, all logged:

**To you (mattoftaylor@gmail.com)**
- New beta application — with everything they submitted
- New feedback submission
- New contact form message

**To users**
- Welcome email on account creation
- Beta application received — confirmation to the applicant
- Beta invite — when you approve someone from the admin panel
- Subscription started, cancelled, payment failed (dunning)
- New file or post from a creator you follow
- Creator payout and Stripe Connect onboarding reminders

**Auth emails** — verification, password reset and magic link get converted from the default generic templates to branded Printreon ones from your domain.

## Part 3 — Announcements, newsletters and mass email

Worth being straight with you here: the built-in system is for one-trigger-one-recipient email — a signup, a purchase, an invite. It deliberately won't do list sends or campaigns, because mixing marketing blasts with account email wrecks a domain's sending reputation and your receipts start landing in spam.

So:
- **Creator announcements** stay as they are today — in-app notifications on the follower's dashboard. I can add an email for the follower's *own* announcements digest later if you want, but it's a separate design.
- **Newsletter / mass marketing** needs a dedicated service (Mailchimp, Beehiiv, Loops, Resend Broadcasts). Best practice is to run that off a *different* subdomain, e.g. `news.printreon.com`, so a campaign unsubscribe never blocks someone's password reset. I can wire an export of your beta list into whichever you pick.

Invites are fine on the built-in system — they're per-person and triggered by your approval, not a blast.

## Part 4 — Admin visibility

The existing `/admin/emails` page gets repointed at the real delivery log: sent / failed / suppressed counts, per-email status with error detail, filters by template and date range, and the bounce/complaint list.

## Technical notes

- Current `src/server/email.server.ts` sends via the Resend gateway from `onboarding@resend.dev`, which only ever delivers to the Resend account owner — that's why beta-application notifications haven't arrived. It gets replaced by the built-in queue (retries, suppression, unsubscribe, delivery log).
- Contact and feedback forms are public/anonymous, so their notifications go through a server route using service-role credentials rather than the authenticated send path.
- Every app email carries a mandatory unsubscribe footer, including the ones addressed to you — that's enforced platform-side and can't be turned off per-email.
- `email_outbox` rows are kept for history; new sends log to the platform delivery log.
- `/contact` currently has no server-side handler wired to email; that gets added.
