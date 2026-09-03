# Landing page: recommended changes

The page reads well and the structure is right (hero, product, how it works, quality, money, pricing + FAQ, apply). These are the changes I would make, in priority order. Pick any subset.

## 1. Make the first three seconds unambiguous

The headline says "A membership home for 3D print creators", which is accurate but abstract to a cold visitor.

- Add a one-line plain-English positioning line directly under the batch line or headline, e.g. "Monthly memberships for people who design printable models."
- Split the audience explicitly in the hero: a creator CTA (Apply) and a supporter CTA, with one sentence each, so a supporter landing from a creator's link knows the page is also for them.

## 2. Mobile ordering and density

On a phone the hero mockup sits below a fairly long block of text, so the product visual is far down.

- Move one mockup directly under the headline on small screens (visual before the paragraph), keeping the current order on desktop.
- Reduce hero headline size slightly on small screens and tighten section padding from `py-16` to `py-12` on mobile so the page is less scroll-heavy.

## 3. A persistent way to apply

The only two entry points are the hero and the very bottom.

- Add a slim sticky bottom bar on mobile (and a header button on desktop) with "Apply for the beta", appearing after the hero scrolls out.

## 4. Show the earnings maths

"10% platform fee" is a number without a story.

- In the money section, add a small worked example: 100 supporters at £5/month is £500, you keep £450 before Stripe's processing fee.
- Optionally make it a tiny interactive calculator (supporters x price) rather than static copy.

## 5. Say what Printreon is instead of

Creators will silently compare this to Patreon, Cults3D, MyMiniFactory and Patreon-plus-Google-Drive.

- Add a short comparison block: file-native library and previews, tier gating on the file itself, signed downloads, version history with supporter notifications, quality badges. Three or four rows, no competitor bashing.

## 6. Trust signals near the application form

- Add a line under the form: what happens next and roughly when ("we review applications weekly"), plus a note that emails only relate to the beta.
- Add a link to the terms and creator agreement next to the submit button.

## 7. Smaller polish

- FAQ becomes a collapsible list on mobile so the section is scannable.
- Add a proper social share image so links posted in Discord/Reddit render as a card rather than plain text.
- Give each mockup a short caption ("Creator dashboard", "Supporter library") so it is obvious these are product screens, not decoration.
- Reduce the hero from two mono status lines (header build line plus the batch line) to one, so it does not read as a motif being repeated.

## What I would not change

The mono/technical voice, the acid accent, the badge system section and the "The money part" dark band all work and give the page a specific identity. The mockups are the strongest asset on the page and should stay front and centre.

## Technical notes

All changes are contained to `src/routes/index.tsx`, `src/components/landing/DashboardMocks.tsx`, `src/components/WaitlistForm.tsx` and the route `head()` for the share image. No backend or schema work. Sticky CTA and FAQ collapse are local component state; the earnings calculator, if wanted, is client-side only.
