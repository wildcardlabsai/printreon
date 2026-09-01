# Terms rewrite + anti-AI-slop stance across the site

Yes — this is worth saying out loud in the copy. It's a genuine differentiator: buyers are tired of unprintable AI dumps, and a public standard is what makes the badge system credible rather than decorative.

## 1. New Terms of Service

Replace `/legal/terms` with the full text you supplied, laid out for reading rather than as a wall of text:

- Numbered section headings with generous spacing, lettered sub-sections (A/B/C) as their own sub-headings.
- Bulleted lists for the badge definitions, prohibited conduct, and DMCA notice requirements.
- The three badge definitions rendered as a highlighted card block so they stand out.
- "Last updated: September 1, 2026" at the top.
- Contact emails (`printreon@gmail.com`, `copyright@printreon.com`) as mailto links.
- A short in-page contents list at the top so people can jump to Payments or Licensing.

Two related legal pages get aligned so nothing contradicts:

- **Creator Agreement** — add a Quality & File Integrity section that points at the Terms badge rules, and correct the platform fee wording to match.
- **DMCA page** — use `copyright@printreon.com` as the designated agent address, matching section 7.

## 2. Badge system realigned to the Terms

Today the upload form asks for origin (`Hand-modelled` / `AI-assisted` / `AI-generated`) and separately lets a creator attach a print photo. The Terms define three badges instead, so:

| Badge | How it's earned |
|---|---|
| Print-Tested | Creator uploads a photo of the physical print |
| Digital Sculpt | Hand-crafted digitally, watertight, scaled — not yet printed |
| AI-Assisted | AI-generated base, then retopologised, repaired and refined by hand |

Changes:

- Upload form offers **Digital Sculpt** or **AI-Assisted** only. The standalone "AI-generated" option disappears, matching the ban on raw AI mesh dumps.
- Choosing AI-Assisted keeps the required note field, reworded to ask exactly what was repaired, retopologised and rescaled.
- **Print-Tested** is awarded automatically when a print photo is attached — it upgrades the badge shown on the file, and the photo is displayed as evidence.
- Existing files stored as `hand` display as Digital Sculpt; the few stored as `ai_generated` display as AI-Assisted and prompt the creator to confirm the file was manually refined. No database migration needed.
- A checkbox at upload: "I confirm this is not a raw, unedited AI export" — required before publishing, and recorded.

## 3. Help Center / FAQ

New entries on `/help`:

- **Do you allow AI-generated models?** — AI-assisted is allowed when the mesh has been repaired, retopologised and scaled by hand. Raw text-to-3D or image-to-3D exports are not, and get removed.
- **What do the badges mean?** — the three definitions in plain language.
- **I don't own a 3D printer — can I still sell?** — yes, under Digital Sculpt, with the watertight/scale requirements.
- **What happens if a file doesn't print?** — the thumbs-down report, the auto-flag on repeated failures, and the first-files review for new creators.
- **How do I get the Print-Tested badge?** — attach a photo of the real print in Files.

## 4. Public copy

- **Landing page** — a short trust line near the top of the features area: real, print-tested files, no raw AI dumps, with the three badges shown.
- **/for-creators** — a Quality Standards block explaining the badges, the disclosure requirement, and the first-files review, framed as a benefit ("your files sit next to files that actually print").
- **Creator onboarding** — a single confirmation step accepting the quality standards before the first upload.
- **Explore / creator pages** — badge already renders; add a one-line legend so buyers know what Print-Tested means.

## Technical notes

- Files touched: `src/routes/legal.terms.tsx`, `legal.creator-agreement.tsx`, `legal.dmca.tsx`, `src/routes/help.tsx`, `src/routes/for-creators.tsx`, `src/routes/index.tsx`, `src/routes/onboarding.creator.tsx`, `src/lib/mesh-preview.ts` (`CREATION_METHODS`), `src/components/QualityBadges.tsx`, `src/routes/dashboard.files.tsx`, `src/routes/admin.stl-library.tsx`.
- Badge display becomes a single derived helper: `print_verified_at` wins, otherwise map `creation_method`. Legacy values map forward, so no schema or data migration.
- Terms page keeps the existing `/legal` sidebar layout and prose styling; only the article body changes.
- Head metadata on the Terms page updated with the new last-updated date and description.
