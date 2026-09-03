# Kill the beta pill, add real dashboard mockups

Two changes to the landing page, both aimed at removing the "generic SaaS" tells.

## 1. Replace the "Beta · live now" pill

The pulsing dot pill in the header is the single most recognisable AI-site cliché. Replace it with a build-log status line that fits Printreon's workshop/blueprint aesthetic:

- Header: a monospace status readout instead of a pill, e.g. `PRINTREON /// BUILD 0.9 /// BETA OPEN` set in small letter-spaced mono, no badge chrome, no pulsing dot, no rounded background. On mobile it collapses to `BETA OPEN`.
- Hero: drop the `Invite-only beta` eyebrow pill too and replace it with a single typeset line above the H1 in the same mono treatment, reading like a stamp on a print job sheet (batch/serial style), not a badge.
- No animation on either. Static, typographic, quiet.

If you'd rather have movement, the alternative is a thin edge-to-edge ticker strip under the header that scrolls one short line of status text. Say the word and I'll swap it in instead.

## 2. Dashboard mockups instead of stock 3D-print photos

Remove the three stock-ish images (`hero.jpg`, `demo-preview-cube.jpg`, `demo-preview-bundle.jpg`) from the "The product" section, and replace the hero image as well.

Rather than AI-generated fake screenshots (they always look slightly wrong — wobbly text, impossible UI), build the mockups as real markup: small, self-contained React mock components styled with the app's own design tokens, so the "screenshots" are literally the same fonts, colours and components as the real product, rendered inside a browser-chrome frame.

Four mock panels to build:

1. **Creator studio overview** — earnings this month, active supporters, file count, a small revenue bar chart. Used as the hero image.
2. **File library** — a table of STL/3MF/ZIP rows with quality badges (Print-Tested / Digital Sculpt / AI-Assisted), tier gating and version notes.
3. **Tiers editor** — two or three tier cards with price, what they unlock, monthly/annual toggle.
4. **Supporter library** — the buyer's view: unlocked files with download buttons.

Each sits in a rounded frame with a fake browser bar (three dots + `printreon.com/dashboard`), marked `aria-hidden` where decorative, with real alt/label text describing what's shown for accessibility and SEO.

Layout: mock 1 large in the hero, mocks 2–4 in the product section grid replacing the current photo collage.

## Technical notes

- New file `src/components/landing/DashboardMocks.tsx` exporting the four mock panels plus a shared `BrowserFrame` wrapper.
- `src/routes/index.tsx`: swap the hero `<img>` and the three `<figure>` images for the mock components; remove the now-unused image imports.
- `src/components/SiteChrome.tsx`: remove the pill markup and its ping animation, add the mono status line.
- Mock data is hardcoded placeholder content inside the component, clearly plausible (no real user data), and responsive down to 440px.
- Existing image assets stay in the repo; they're just no longer used on the landing page.
