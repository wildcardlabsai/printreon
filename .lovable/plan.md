# Polish pass: dashboard, licensing, file handling

A shortlist of high-value additions based on what's already built. Pick the ones you want and I'll implement in that order.

## 1. File versioning that supporters can see (highest value)

Files carry a `version` number today, but there is no history behind it. Add a proper "upload new version" flow:

- Creator uploads a replacement file with a short changelog note ("fixed non-manifold edges, added supports-free variant").
- Old versions stay downloadable; the newest is default.
- Supporters who downloaded a previous version get an "Updated" flag in their library and an optional notification email.

Why: model updates are the number one reason people stay subscribed month to month.

## 2. Licence certificates

Commercial licences are currently derived on the fly from a supporter's commercial tier, so there is nothing a supporter can show a customer or a marketplace.

- Issue a licence record with a licence number, scope, issue date and creator/tier snapshot at the time of purchase.
- Supporter-facing licence page and downloadable PDF/printable certificate.
- Creator side keeps the current issued-licences list, plus revoke on refund/chargeback.
- Snapshot matters: if a creator later changes tier terms, existing licences keep the terms they were sold under.

## 3. File handling quality-of-life

- Bulk actions in the file library: publish, unpublish, retag, change tier, delete.
- Drag-and-drop multi-file upload with a queue instead of one at a time.
- Auto-inspect ZIP contents on upload and list what's inside (STL count, images, readme) so supporters know before downloading.
- Per-file "what's included" summary generated from the archive, editable by the creator.
- Duplicate detection by file hash so the same STL is not uploaded twice.

## 4. Supporter library upgrades

- Search and filter across everything a supporter has unlocked.
- "New since your last visit" section.
- Download-all-as-zip for a creator's unlocked set (server-side, rate-limit aware; the current limit is 60 downloads per rolling hour).
- Keep a permanent record of files unlocked while subscribed, clearly separated from files that need an active subscription to download again.

## 5. Creator dashboard depth

Analytics currently covers a fixed 30-day window of downloads, new subs and revenue.

- Selectable range (7 / 30 / 90 / all) and month-over-month comparison.
- Churn and retention: cancellations, net new, average supporter lifetime.
- Revenue split by tier, and annual vs monthly mix.
- CSV export for supporters, downloads and earnings.
- A first-run checklist on the dashboard home (Stripe connected, first tier, first file, page published) so new creators know what's left.

## 6. Trust and safety follow-ups

- Automatic mesh health check on upload (non-manifold, open edges, wall thickness warning) surfaced to the creator before publishing rather than after.
- Print-proof reminders: nudge creators whose AI-disclosed files still lack a print photo.
- Refund/chargeback handling that revokes access and reverses the ledger entry.

## Suggested order

1. File versioning + update notifications
2. Licence certificates
3. Bulk file actions + multi-upload
4. Supporter library search / new-since
5. Analytics ranges, churn, CSV export
6. Safety follow-ups

## Technical notes

- Versioning needs a `creator_file_versions` table (file id, version, storage path, size, changelog, created_at) with RLS mirroring `creator_files`, plus grants; downloads resolve to a version id.
- Licences need a `licences` table with a generated licence number and a term snapshot column; issue on subscription activation to a commercial tier via the existing subscription lifecycle handler, revoke on cancel/refund.
- Bulk actions and zip inspection run as server functions (`createServerFn`) using the admin client after verifying creator ownership; ZIP listing must be a pure-JS unzip for the Worker runtime.
- CSV export streams from a server function; no new client deps.
