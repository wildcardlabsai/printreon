## Goal

Turn the public site into a pre-launch landing page that captures interest (email + role) while keeping the existing marketing content visible. Hide all navigation/auth so the public can't sign up or sign in yet — testing accounts still reachable via direct `/auth` URL.

## Changes

### 1. Database — `waitlist_signups` table
New table to store interest:
- `email` (unique, lowercased)
- `role` — `'creator' | 'supporter'`
- `source` (default `'landing'`, for future channels)
- `user_agent`, `referrer` (optional, for light attribution)

RLS:
- Public (anon) can INSERT (so the form works without login).
- Only admins can SELECT/UPDATE/DELETE (via existing `has_role` pattern).

### 2. Waitlist form component
New `src/components/WaitlistForm.tsx`:
- Email input + segmented toggle: "I'm a creator" / "I'm a supporter".
- Zod validation (email, role enum), max length, trim.
- Inserts directly via supabase client; shows success state ("You're on the list — we'll email you at launch.").
- Handles duplicate-email gracefully ("You're already on the list").

### 3. Landing page (`src/routes/index.tsx`)
- Replace the Hero CTAs ("Start as a Creator" / "Explore Creators") with the `WaitlistForm`.
- Replace the Final CTA section's button with a second `WaitlistForm` instance.
- Remove the `/auth` and `/explore` Links from the Pricing section cards (replace with a "Join waitlist" anchor that scrolls to the hero form).
- Keep all other marketing sections (Built For, How It Works, Features, etc.) intact.

### 4. Site chrome (`src/components/SiteChrome.tsx`)
- **Header:** remove nav links (Explore / For Creators / Pricing), remove all auth buttons (Sign in / Get started / My account / Creator studio / Sign out). Header becomes just the Logo + a small "Join waitlist" button that scrolls to the form. Direct `/auth` URL still works for you.
- **Footer:** strip to minimal — Logo + tagline on the left, Legal links (Terms, Privacy, DMCA, Creator Agreement) + Contact link on the right. Remove Platform & Company columns.

### 5. SEO
Update landing `head()` title/description to reflect pre-launch ("Printreon — Join the waitlist for memberships built for 3D print creators").

## Out of scope
- No email confirmation / double opt-in (can add later via Lovable Emails).
- No admin UI to view the waitlist yet — you can query it directly through the backend if needed.
- Internal routes (`/dashboard`, `/me`, `/admin`, `/auth`) remain functional via direct URL for testing.
