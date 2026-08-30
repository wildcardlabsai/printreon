# Landing page: layout, colour, copy refinement

Keeps the brand, all sections and all positioning. This is hierarchy, rhythm, colour depth and copy only.

## What's working (keep)

The serif + sans + mono trio, the dark section breaks, the credible dashboard mockup, and the copy voice ("No plugins. No duct tape.").

## 1. Hero — one clear action

- Collapse the four stacked trust rows (buttons → icon row → "Limited founding creator spots" pill → avatar cluster) into a single line: `Invite-only beta · Founder pricing for life · Built for 3D creators`.
- Remove the avatar cluster and "300+ creators already on the list" unless that number is real. If it is, render it live from the preregistration count instead of hardcoding.
- Keep one primary CTA; demote "Explore Features" to a quiet text link with a down-arrow.
- Reword the headline so it doesn't pre-empt the "Made for makers, not generic content creators" section directly below it — right now they say nearly the same thing.

## 2. Break the section rhythm

Eight sections currently share the same eyebrow / italic-serif + bold-sans headline left / content right layout. Vary it:

- Keep the split layout for: Made for makers, Inside the dashboard, For supporters.
- Centre the headline for: Everything in the box, Founder benefits, Pricing, Final CTA.
- Make Growth tools a full-width numbered horizontal band instead of another split.
- Cut roughly 20% of vertical section padding so the page reads denser and the scroll cost drops.

## 3. Colour — add a mid-tone, commit to the lime

- Add a warm mid-tone surface token (a deeper sand between cream and near-black) so transitions read cream → sand → charcoal → cream instead of hard jumps.
- Use the electric lime consistently as the "free / supporter / included" signal: free-tier badges, supporter CTA, supporter-section checkmarks. It currently appears twice and reads accidental.
- Reserve orange strictly for creator / founder / primary actions.

## 4. Fix the two weak proof points

- **Dashboard files mock:** six identical grey cube placeholders actively undercut the "a tool that understands files" claim. Swap in the real demo preview thumbnails already in `src/assets` and vary the card sizes so it looks like a live library.
- **Founder vs Standard:** "Standard platform fee" vs "Reduced platform fee — for life" communicates nothing. Use concrete figures, or an explicit "final % confirmed at invite" line.

## 5. Typography and copy

- Cap the italic-serif + bold-sans headline construction at four uses; convert the rest to plain bold sans so the device stays special. It currently runs in seven headlines.
- Reduce the largest desktop headline sizes slightly — several wrap to three lines and eat the fold.
- Tighten body copy: several paragraphs run three lines where two would do.

## Technical notes

- Confined to `src/routes/index.tsx`, `src/components/SiteChrome.tsx`, and `src/styles.css` (new surface token, spacing tweaks).
- No database or business-logic changes, aside from optionally reading a real preregistration count for the hero.
