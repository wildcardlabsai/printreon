# Site-wide status banner: Stripe Connect issue

Add a thin notice strip above the header on every public page, so creators
hitting the payout onboarding error see it before they email you.

## What it says

> **Known issue:** some creators are seeing an intermittent error when connecting a
> payout account. Stripe are reviewing it and we expect it resolved shortly. Everything
> else works as normal.

Wording is editable in one place; tell me if you want different phrasing.

## Behaviour

- Sits at the very top, above the sticky header, on all public pages and the
  creator dashboard (so the affected people see it).
- Amber/warning styling using existing tokens, small text, one line on desktop
  and wrapping on mobile.
- Dismissible with an X; the dismissal is remembered in the browser so it does
  not nag on every page view.
- No backend, no admin toggle: turning it off later is a one-line change (or I
  can add an admin switch if you prefer).

## Technical notes

- New `src/components/StatusBanner.tsx` holding the copy, an `ACTIVE` flag and
  a `localStorage` dismissal key.
- Rendered inside `SiteChrome.tsx` above `<header>`, and in the dashboard
  layout, so it appears once per page and does not break the sticky header.
- Dismissal state read in `useEffect` to avoid a hydration mismatch.
