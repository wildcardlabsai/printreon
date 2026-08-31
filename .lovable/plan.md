# Email setup for printreon.com

Two separate systems, no clash:

| | Mailboxes (you read/reply) | App emails (Printreon sends) |
|---|---|---|
| Provider | Zoho Mail | Lovable built-in email |
| Address | info@printreon.com, invites@printreon.com | e.g. Printreon <hello@printreon.com> |
| Lives on | printreon.com (root) | notify.printreon.com (subdomain) |
| DNS at Namecheap | MX + SPF + DKIM records you add | one set of NS records for the subdomain only |

Both can safely coexist because they use different names. Zoho owns the root domain's mail; Lovable owns only the `notify.` subdomain. Nothing Zoho needs gets overwritten.

`info@` and `invites@` both work fine — Zoho's free plan covers multiple mailboxes and aliases on one domain.

## Part 1 — Zoho mailboxes (you do this, ~20 minutes)

1. Sign up at zoho.com/mail, choose the free "Forever Free" plan, enter `printreon.com`.
2. Zoho asks you to verify ownership — it gives you a TXT (or CNAME) record. Add it in Namecheap under Domain List > printreon.com > Advanced DNS.
3. Create the mailboxes: `info@printreon.com` and `invites@printreon.com`.
4. Add Zoho's MX records in Namecheap Advanced DNS (Zoho shows the exact hosts and priorities). Delete any Namecheap "Email Forwarding" / parking MX records first, or mail will bounce.
5. Add Zoho's SPF (TXT) and DKIM (TXT) records.
6. Wait for propagation (usually under an hour), then send yourself a test message.

Optional: in Zoho you can forward `info@` to your Gmail and set Gmail up to send-as `info@printreon.com`, so you never have to open a second inbox.

## Part 2 — App sending (I do this)

1. Set up the sender domain through Lovable's email setup — you'll get a short dialog and one set of NS records to paste into Namecheap for `notify.printreon.com`. This is the only DNS bit for app email.
2. Once that's registered, I'll install the email infrastructure (queue, retries, delivery log, bounce/complaint handling, unsubscribe).
3. Build branded Printreon email templates matching the site (acid-lime accents, Instrument Serif headings, white background).
4. Wire up the emails the platform actually needs:
   - Beta application received → notification to `invites@printreon.com`, plus a confirmation to the applicant
   - Welcome email on account creation
   - Subscription started / cancelled / payment failed
   - New file or post from a creator you follow
   - Creator payout and Connect onboarding reminders
5. Convert the existing auth emails (verification, password reset, magic link) to branded Printreon templates instead of the default generic ones.
6. Replace the current Resend-backed sending path so everything runs through one system with a single delivery log.

## Part 3 — Admin visibility

The existing `/admin/emails` page gets repointed at the new delivery log: sent / failed / suppressed counts, per-email status, filters by template and date, and the bounce list. Same page, real data behind it.

## Technical notes

- The current `src/server/email.server.ts` sends via the Resend connector gateway from `onboarding@resend.dev`, which only delivers to the Resend account owner — that's why beta-application emails haven't been arriving. It gets replaced.
- Lovable email delegates `notify.printreon.com` to Lovable nameservers and manages SPF/DKIM/MX inside that delegated zone only. Root-domain records (Zoho's) are untouched.
- Sender domain for the API is the delegated subdomain; the visible From address can still read as `@printreon.com`.
- `email_outbox` rows stay for history; new sends log to the platform's delivery log.

## Order

Part 2 can start immediately — it doesn't wait on Zoho. Suggest kicking off the sender domain dialog now and doing the Zoho signup in parallel.
