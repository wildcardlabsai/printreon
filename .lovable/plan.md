## Plan

Replace the current hero preview image with the newly uploaded Printreon dashboard mockup (landscape, browser-chrome style).

### Steps

1. Copy `user-uploads://F76282EB-38B6-4D0D-86FA-223A654EF104.png` → `src/assets/hero-dashboard-preview.png`.
2. In `src/routes/index.tsx`:
   - Update the import to point at the new `.png` file.
   - Update `<img>` `width`/`height` to match the new landscape aspect (≈1536×1024, i.e. 3:2) instead of the old 4:5 portrait dimensions.
   - If the surrounding hero slot is hard-locked to a 4:5 portrait frame, relax it to `aspect-[3/2]` (or similar) so the landscape screenshot isn't cropped awkwardly. I'll confirm by reading the current hero markup before editing.
3. Leave the old `hero-dashboard-preview.jpg` in place (unused) — safe to delete in a follow-up if you want.

### Notes

- The image already contains its own browser chrome + Printreon logo, so no extra framing needed.
- No copy/text changes to the surrounding hero section unless the new aspect ratio forces a layout tweak.
