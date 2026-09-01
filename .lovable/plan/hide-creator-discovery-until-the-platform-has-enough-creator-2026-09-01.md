# Hide creator discovery until the platform has enough creators

While only a handful of creators are live, discovery surfaces make the site feel empty. Discovery auto-hides below a threshold and switches itself back on once enough published creators exist — no manual step.

## Rule

- Threshold: **6 published, non-suspended creators** (single constant, easy to change).
- Below the threshold: all "Explore / Find / Discover creators" entry points are hidden, and `/explore` shows a "creators coming soon" waitlist page instead of the grid.
- At or above the threshold: everything reappears exactly as it is today.
- Creator pages (`/c/:slug`) stay fully public and shareable either way — direct links, subscribe and checkout are unaffected.

## What changes

**Discovery gate**
- A small shared hook counts published creators once (cached via TanStack Query) and returns `discoveryEnabled`.

**Header / footer / landing**
- Hide the "Explore creators" nav link (desktop + mobile sheet) while gated.
- Hide the two "Explore creators" buttons on the landing page (hero and closing CTA), leaving the sign-up / creator-application CTAs in place so the page stays balanced.

**/explore route**
- While gated, the page renders the existing "Printreon is opening for creators soon" panel with the waitlist email form and the "Are you a creator? Start your page" link — no creator grid, no featured/trending section, no search box.

**Buyer surfaces (`/me/*`)**
- Empty-state buttons that currently point to `/explore` (`downloads`, `subscriptions`, `library`, `following`, `me` index card) swap to "Creators coming soon — join the waitlist" copy pointing at `/explore`, or are hidden where the empty state still reads well without them.
- The "no creators yet" state on `/c/:slug` keeps its link since `/explore` still serves the waitlist page.

**Sitemap**
- Leave `/explore` in the sitemap; it still returns a real page.

## Technical notes

- New `src/lib/use-discovery.ts` exporting `DISCOVERY_MIN_CREATORS = 6` and `useDiscoveryEnabled()`, backed by a `head`-style count query on `creator_profiles` (`is_published = true`, `suspended_at is null`). No schema change, no migration.
- The count query runs client-side with a long `staleTime`; while loading, discovery is treated as hidden to avoid a flash of links that then disappear.
- Files touched: `src/lib/use-discovery.ts` (new), `src/components/SiteChrome.tsx`, `src/routes/index.tsx`, `src/routes/explore.tsx`, `src/routes/me.index.tsx`, `me.downloads.tsx`, `me.subscriptions.tsx`, `me.library.tsx`, `me.following.tsx`.
