# Landing page design + copy refinement

Goal: keep the current brand and all existing content, but fix rhythm, colour depth, hero focus and the weakest proof points.

## 1. Hero — one clear action

- Collapse the four stacked trust rows into a single line under the buttons: `Invite-only beta · Founder pricing for life · Built for 3D creators`.
- Remove the avatar cluster + "300+ creators already on the list" unless that number is real and can be read from `beta_preregistrations`. If it is real, render it live from the database instead of hardcoding.
- Keep primary CTA only; demote "Explore Features" to a quiet text link with a down-arrow.
- Tighten the headline so it does not pre-empt the "Made for makers, not generic content creators" section below.

## 2. Break the section rhythm

Currently eight sections share the same left-headline / right-content layout. Vary them:

- Keep split layout for: Made for makers, Inside the dashboard, For supporters.
- Centre the headline for: Everything in the box, Founder benefits, Pricing, Final CTA.
- Make "Growth tools" a full-width numbered horizontal band rather than another split.
- Reduce vertical padding roughly 20% across sections so the page reads denser.

## 3. Colour — add a mid-tone and use the lime

- Introduce a warm mid-tone surface token (a deeper sand between cream and near-black) so section transitions are cream → sand → charcoal → cream instead of hard cream/black jumps.
- Use the electric lime consistently as the "free / supporter / included" signal colour: free-tier badges, supporter CTA, checkmarks in the supporter section. Right now it appears twice and reads accidental.
- Keep orange strictly for creator/founder/primary actions.

## 4. Fix the weak proof points

- **Dashboard files mock:** replace the six identical grey cube placeholders with the actual demo preview thumbnails already in `src/assets`, and vary the card sizes so it looks like a real library.
- **Founder vs Standard table:** replace "Standard platform fee" / "Reduced platform fee — for life" with concrete figures or an explicit "final % confirmed at invite" note. Vague comparisons cost conversions.
- Add one line of honest scarcity to the Beta Access section stating the wave size, if a number is decided.

## 5. Typography and copy

- Cap the italic-serif + bold-sans headline construction at four uses; convert the rest to plain bold sans so the device stays special.
- Reduce the largest headline sizes slightly on desktop; several currently wrap to three lines and eat the fold.
- Rewrite "Made for makers, not generic content creators" so it does not echo the hero.
- Pass over body copy for length: several paragraphs are three lines where two would do.

## Technical notes

- Work is confined to `src/routes/index.tsx`, `src/components/SiteChrome.tsx` and `src/styles.css` (new surface token, spacing scale tweaks).
- No database or business-logic changes, except optionally reading a real preregistration count for the hero via an existing server function pattern.
- Existing sections, features and positioning are all preserved — this is layout, colour, hierarchy and copy only.
