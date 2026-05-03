
## Problem

A user can be both a buyer (member) and a seller (creator), but the UI hides the buyer side once they become a creator:

- The header's single "Dashboard" button sends creators only to `/dashboard` (creator studio). There is no link to `/me` (buyer account).
- Inside `/dashboard` there is no way to jump to `/me`, and vice versa.
- Nothing visually signals "you are wearing your seller hat right now".

## Fix

Make the two roles always visible and switchable for any creator account.

### 1. Header (`src/components/SiteChrome.tsx`)

Replace the single `Dashboard` button with two buttons when the user is signed in:

- **My account** → `/me` (always shown, icon: `User`)
- **Creator studio** → `/dashboard` (only if `isCreator`, icon: `LayoutDashboard`, primary style so it stands out)

Non-creators still only see "My account" plus a subtle "Become a creator" link → `/onboarding/creator`.

### 2. Role switcher banner on dashboards

Add a small `RoleSwitcher` component used at the top of both `dashboard.tsx` and `me.tsx`. It renders a pill-style segmented control:

```text
[ 🛒 Buying  ] [ 🎨 Selling ]
```

- Highlights the active side based on current path.
- "Selling" tab is shown only if the user is a creator; for non-creators it shows "+ Become a creator" pointing at `/onboarding/creator`.
- Clicking the inactive tab navigates to `/me` or `/dashboard`.

### 3. Page headers reword for clarity

- `dashboard.tsx` eyebrow: `Creator studio · selling` (already says Creator studio, add "selling" suffix).
- `me.tsx` eyebrow: `Your account · buying`.

### 4. Member overview cross-link

On `/me` overview (`src/routes/me.index.tsx`), if the user is a creator, show a small card "You also have a creator studio → Open studio". On `/dashboard` overview, if the creator profile exists, show a matching "Switch to buyer view → My account" link near the public-page button.

## Files to change

- `src/components/SiteChrome.tsx` — split Dashboard button into "My account" + "Creator studio".
- `src/components/RoleSwitcher.tsx` — new component (segmented buying/selling switcher).
- `src/routes/dashboard.tsx` — render `<RoleSwitcher />` above `DashboardNav`, tweak eyebrow text, add "Switch to buyer view" link.
- `src/routes/me.tsx` — render `<RoleSwitcher />` above `MemberNav`, tweak eyebrow text.
- `src/routes/me.index.tsx` — add small "You also have a creator studio" card when `isCreator`.

No DB or backend changes needed; `useAuth()` already exposes `isCreator`.
