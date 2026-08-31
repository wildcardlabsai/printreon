# Email setup for printreon.com

Two separate systems, no clash:

| | Mailboxes (you read/reply) | App emails (Printreon sends) |
|---|---|---|
| Provider | Namecheap Private Email | Lovable built-in email |
| Address | info@printreon.com, invites@printreon.com | e.g. Printreon <hello@printreon.com> |
| Lives on | printreon.com (root) | notify.printreon.com (subdomain) |
| DNS at Namecheap | MX + SPF + DKIM, auto-configured | one set of NS records for the subdomain only |

Both can safely coexist because they use different names. Private Email owns the root domain's mail; Lovable owns only the `notify.` subdomain. Nothing gets overwritten.

Private Email is the simplest route here since the domain is already at Namecheap — they set the mail DNS up for you automatically, so there's no manual record entry like Zoho needed.

## Part 1 — Namecheap Private Email (you do this, ~10 minutes)

1. In Namecheap: Domain List > printreon.com > **Private Email** tab (or Apps > Private Email), and buy a plan. The Starter plan (~£10/yr) includes one mailbox; you can add a second mailbox for a small extra, or use aliases for free.
2. During setup Namecheap asks which domain to use — pick `printreon.com`. It offers to **auto-configure the DNS records** (MX, SPF, DKIM, autodiscover). Accept that; it writes them into Advanced DNS for you.
3. Create the mailbox `info@printreon.com`.
4. For `invites@printreon.com`: either add a second mailbox, or add it as a **free alias** on the info@ mailbox if you're happy for both to land in one inbox. Aliases are under Private Email > Manage > Aliases.
5. Wait for propagation (usually well under an hour), then send yourself a test message. Webmail is at privateemail.com.

Cheaper alternative if you don't need a real mailbox: Namecheap includes **free email forwarding** on domains registered with them (Advanced DNS > Mail Settings > Email Forwarding). That forwards info@ and invites@ straight to your Gmail — you can receive, but replying from that address needs extra Gmail SMTP setup. Private Email is the cleaner option if you want to reply as info@printreon.com.

One thing to watch: if you turn on Namecheap Email Forwarding *and* Private Email, the MX records conflict. Pick one.


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
