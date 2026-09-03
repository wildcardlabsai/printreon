# Landing page rebuild + admin invite / activation / newsletter emails

Two pieces of work: make the landing page read like a real product built by a real person, and make the admin panel actually send the emails instead of copying links around.

## Part 1 — Why the page reads as AI-written

Confirmed in `src/routes/index.tsx`: 14 near-identical sections, every single one opening with a `// eyebrow` mono label, 25 em dashes, and repeated "not X, it's Y" constructions. That template repetition is the tell, more than any individual sentence.

The fix is not a new aesthetic gimmick. It's to lead with what the product actually **is** — a subscription home for 3D print creators to sell and deliver STL files — and show that thing working, rather than describing it fourteen times in the same shape.

### Structure: 14 sections down to 7

```text
1  Hero            One sentence on what it is. One CTA. Real product shot.
2  The product     A real creator page + tier + file library, annotated.
3  How it works    Upload -> set tiers -> paid -> deliver. Four steps, one row.
4  Quality bar     Disclosure, print-tested badges, review queue. The differentiator.
5  Money           Stripe, payouts, fees. Numbers, no adjectives.
6  Pricing + FAQ   Merged. Founder terms sit inside pricing, not a separate pitch.
7  Apply           Waitlist form. Nothing after it.
```

Removed or folded in: the separate "Everything in the box" grid, "Growth tools", "For supporters", "Community", "Why Printreon exists", "Founder benefits", and the marquee strip. Their real content moves into sections 2, 4 and 6; the filler goes.

### Layout changes

- Kill the `// eyebrow` label on all but two sections. Repeated fourteen times, it stops being a style.
- Break the identical split-left/split-right rhythm: section 2 is a large annotated product screenshot with callout lines, section 3 is a single horizontal numbered band, section 5 is a small figures table.
- Cut section padding from `py-24` to a tighter, varying rhythm so the page is roughly half its current scroll length.
- Replace the six identical grey cube placeholders with the real demo thumbnails in `src/assets`, at varying card sizes.
- No stock avatar clusters and no invented counts. If a number appears, it's read from the database or it's cut.

### Copy rules (applied everywhere, not just the landing page)

- Zero em dashes. Full stops, or a comma.
- Zero "not just X — it's Y", "isn't about X, it's about Y", "no plugins, no duct tape" triads.
- No "seamlessly", "effortlessly", "unlock", "empower", "elevate", "supercharge", "in today's world".
- Sentences of uneven length. Some short. Some that carry a full clause and then stop.
- Specifics over claims: "10% platform fee" not "creator-friendly economics"; "STL, 3MF, OBJ, ZIP" not "all your file types".
- Confident but honest about stage: invite-only beta, small, growing. No fake scale.

## Part 2 — Preregistrations: send the invite by email

`adminSendBetaInvite` already exists and sends the `beta-invite` template, but `/admin/preregistrations` never calls it. It only mints a code and copies a link to the clipboard.

- Rewire the drawer's "Send invite" and add a per-row invite button so both call the server function: mint the code, mark the row `invited`, send the branded invite email, log it.
- Toast reports the real outcome (sent, or suppressed recipient) instead of "link copied".
- Keep "Copy link" as a secondary action for the odd manual case.
- Bulk-select gets a "Send invites" action that loops the selected rows one at a time.
- Guard against double-sending: if the row is already `invited`, ask for confirmation before resending.

## Part 3 — Activate a creator, send a welcome

New `adminActivateCreator` server function (admin-only):

1. Set `is_published = true` on the creator profile.
2. Send a new `creator-welcome` email to the creator's account address.
3. Write an `admin_activity_log` entry.

`/admin/creators` gets an "Activate" button on unpublished rows that runs all three, and shows sent/failed state. The existing publish toggle stays for un-publishing.

New template `src/lib/email-templates/creator-welcome.tsx`: what they can do now, link to the creator dashboard, the quality standards in one short paragraph, link to set up payouts.

## Part 4 — Newsletter

The built-in email system is deliberately one-trigger-one-recipient, so it won't send a campaign blast to the whole list, and forcing it to would damage the domain's deliverability for invites and password resets. What it will do:

- Send the existing `newsletter-welcome` email automatically when someone subscribes (currently the subscribe path stores the row; this wires the confirmation send).
- Add a "Resend welcome" per-row action in `/admin/newsletter` for anyone who never received it.
- Keep CSV export for real campaign sends through a dedicated newsletter tool on a separate subdomain.

If you want true broadcast campaigns from inside the admin panel, that's a separate integration and I'd rather scope it once the list is worth mailing.

## Sender name

All of these send as **Printreon**. The sender name is already set in `send-email.ts` and the auth webhook, so invites, welcomes and newsletter confirmations all show as Printreon in the inbox regardless of the underlying address.

## Technical notes

- Landing work is confined to `src/routes/index.tsx` and `src/styles.css` (spacing/rhythm tokens). No schema or business-logic changes.
- New server functions go in `src/functions/inbox.functions.ts` and `src/functions/admin.functions.ts`, both admin-gated via the existing `assertAdmin` pattern.
- New template registered in `src/lib/email-templates/registry.ts`.
- Copy sweep also touches `for-creators.tsx`, `about.tsx` and `pricing.tsx` for the same em-dash and construction rules, so the voice matches.
