# Admin-managed changelog + public feedback form

Two additions: a changelog you can edit from the admin panel, and a simple feedback form anyone can submit.

## Changelog

- New `changelog_entries` table: title, body, entry date, published flag.
- `/changelog` becomes data-driven: shows published entries newest first, with the existing page styling. Existing hard-coded entries are re-entered as rows so nothing is lost.
- New admin page `/admin/changelog`: create, edit, publish/unpublish and delete entries.
- Link "Changelog" and the existing "Roadmap" page from the site footer so people can actually find them.

## Feedback

- New `/feedback` page, open to anyone (no sign-in needed): type (Idea / Bug / Other), message, optional name, email (required when signed out, pre-filled when signed in).
- Submissions land in a new `feedback` table with status `new` / `reviewing` / `done`.
- New admin page `/admin/feedback`: list submissions with filters by type and status, change status, add internal notes.
- Anti-spam: required email format, length limits, a hidden honeypot field, and a short client-side cooldown between submissions.
- "Feedback" link added to the footer and to the account/creator menus.

## Technical notes

- Migration creates `changelog_entries` and `feedback`, both with GRANTs and RLS:
  - `changelog_entries`: `anon`/`authenticated` SELECT where `is_published`; full access only via `has_role(auth.uid(),'admin')`.
  - `feedback`: INSERT allowed for `anon` and `authenticated` (validated columns only, no status/notes control); SELECT/UPDATE restricted to admins.
- Public inserts go through a `SECURITY DEFINER` RPC (same pattern as `submit_beta_preregistration`) so status and notes cannot be set by the submitter.
- `/changelog` reads published entries through a public server function using the publishable key; admin pages use authenticated queries with the existing admin sidebar layout.
- No changes to existing support ticket handling — feedback is a separate, lighter queue.
