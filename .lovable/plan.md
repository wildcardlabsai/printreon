# Raising file quality: AI disclosure, first-upload review, print proof

Goal: make it awkward and unrewarding to dump untested AI-generated models, without adding heavy friction for genuine makers.

## 1. AI disclosure on every upload

Creators must answer, before a file can be published:

- How was this made? — Modelled by hand / AI-assisted (AI used for concept or parts) / AI-generated (text or image to 3D)
- If AI was involved: a short note on what was cleaned up or retopologised

The answer shows as a badge on the file card, file page and in `/explore` ("Hand-modelled", "AI-assisted", "AI-generated"). Buyers can filter AI-generated files out of Explore. Undisclosed AI use that gets reported is a takedown reason in the existing moderation flow.

## 2. First uploads reviewed before going live

New creators' first 3 published files land in a review queue instead of going straight live:

- File status becomes `pending_review`; creator sees a clear "In review" state with the reason
- Admin queue at `/admin/stl-library` (new "Awaiting review" tab) with approve / reject + reason
- Approving the 3rd file flips the creator to trusted, and everything after publishes instantly
- Rejection notifies the creator with the reason and keeps the file as a draft

Files that fail automatic checks (below) go back into review even for trusted creators.

## 3. Automatic sanity checks at upload

The browser already parses the mesh to make thumbnails, so the checks are free. Store the results and surface them:

- Fails to parse / no geometry → cannot publish at all
- Zero or absurd dimensions (sub-1mm or over 1000mm), fewer than ~100 triangles, or a triangle count wildly out of proportion to file size → warning + auto-flag for review
- No thumbnail could be rendered → cannot publish

Warnings appear inline in the upload form so the creator can fix or replace before submitting.

## 4. Print-verified badge

Creators can attach a photo of the actual printed model to a file. Verified files get a "Print verified" badge and rank above unverified ones in Explore. Buyers see it as the strongest quality signal on the page.

## 5. Buyer quality ratings

After downloading, supporters get a simple prompt: "Did this print successfully?" — yes / no / didn't print yet, plus optional note and photo (reuses the existing print log).

- Aggregate success rate shown on the file once there are 3+ responses
- Files dropping below ~40% success with 5+ responses are auto-flagged into the admin review queue
- Creator sees their own success rates on `/dashboard/files`

## Technical notes

- New columns on `creator_files`: `creation_method`, `ai_disclosure_note`, `review_status`, `reviewed_at`, `reviewed_by`, `review_notes`, `quality_flags` (jsonb), `print_verified_image_url`, `print_verified_at`.
- New column on `creator_profiles`: `trusted_at` (null = still in first-uploads review).
- New table `file_print_reports` (user_id, file_id, outcome, note, photo_url) with RLS: users write their own, creator and admin read; aggregate exposed through a security-definer function so raw rows stay private.
- Publishing moves behind a server function that enforces disclosure, checks quality flags, and decides live vs `pending_review` — the client can no longer flip `is_published` directly, so the RLS update policy on `creator_files` is narrowed accordingly.
- Mesh checks extend `src/lib/mesh-preview.ts` (dimension/triangle heuristics returned alongside existing stats).
- Print-verified photos and rating photos go to the existing private `print-log` bucket, served through signed URLs.

## Build order

1. Disclosure field + badges (fast, biggest deterrent)
2. Automatic mesh checks and publish-gating server function
3. First-3-files admin review queue and trusted flag
4. Print-verified badge
5. Buyer success ratings and auto-flagging
