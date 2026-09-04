# Stripe restricted-business appeal: reposition Printreon as a digital 3D file marketplace

Stripe's reviewer has classified the account under "content creation" (their
Patreon-style restricted category). Printreon is not that: it sells and
licenses **downloadable 3D CAD/print files (STL, 3MF, OBJ, ZIP)**, with
delivery via signed download links, per-file licences, moderation, and
Connect payouts to identity-verified designers. The appeal has to make that
distinction obvious, and the public site has to back it up when the reviewer
looks.

## Part 1: The appeal (deliverable you send to Stripe)

I will write a complete appeal response you can paste into Stripe's
additional-details form / email, covering what their review team asks for:

- **What is sold**: licensed digital 3D model files for 3D printing. Nothing
  physical ships. No adult content, no fan-funding of undefined "content".
- **Business model**: buyers pay a monthly membership to a designer and
  receive access to that designer's file library. Printreon takes a 10%
  platform fee; the rest is paid to the designer through Connect Express.
- **Delivery**: files are delivered digitally, immediately, through expiring
  signed URLs, with per-file licence records and download rate limits.
- **Who sells**: invite-only, manually approved designers with verified
  Stripe accounts. No open signup.
- **Content controls**: upload review for new creators, mesh sanity checks,
  AI disclosure requirement plus print-proof for fully AI-generated files,
  DMCA/IP policy, moderation and reporting queue, admin suspension.
- **Refunds, chargebacks, support**: policy statements pulled from the live
  Terms.
- **Category framing**: closest legitimate Stripe category is digital goods /
  software and digital media downloads, not fan funding or content creation.
- **Evidence links**: live URLs for Terms, Creator Agreement, DMCA, Privacy,
  pricing, a public creator page, and the quality/AI policy.

Output goes into a file you can copy from, plus a short version for the form
if it has a character limit.

## Part 2: Site copy repositioning

Reviewers look at the homepage first. Today the first line reads "A membership
home for 3D print creators", which reads exactly like the restricted category.
I will reframe the product-facing wording to lead with the digital product,
keeping the brand and design untouched.

Pages and copy to update:

- `src/routes/index.tsx` — hero headline/subhead, meta title/description,
  OG/Twitter text, and the section intros: lead with "licensed 3D printable
  files", "digital downloads", "file library", with membership as the
  *billing method* rather than the product.
- `src/routes/about.tsx` — same reframing, plus an explicit "what we sell"
  paragraph a reviewer can read in five seconds.
- `src/routes/pricing.tsx` — describe the 10% fee as a marketplace fee on
  digital-file sales.
- `src/routes/for-creators.tsx`, `src/routes/join.tsx`, `src/routes/help.tsx`
  — align headline wording and FAQ answers.
- `src/components/SiteChrome.tsx` footer tagline, `public/manifest.webmanifest`
  description, `src/lib/site.ts` shared strings.
- Add a short **"What Printreon sells"** block near the footer of `/about`
  and on `/legal` linking Terms, Creator Agreement, DMCA and refund policy,
  so the compliance story is one click from anywhere.

Words to reduce: "content", "content creator", "fan", "support a creator",
"membership home". Words to lead with: "3D printable files", "STL/3MF/OBJ
downloads", "digital file library", "licence", "designer", "marketplace".
Existing terms and legal text stay legally identical; only positioning
language changes.

## Part 3: No payment code changes

Stripe Connect wiring, checkout, webhooks and payouts stay exactly as they
are. This is a classification issue, not a technical one. If Stripe still
declines after the appeal, the fallback conversation is a separate task
(and marketplace-style creator payouts are limited outside Connect, so it
would be a significant rebuild).

## Technical notes

- Copy-only edits to route components and static strings; no schema, server
  function, or Stripe API changes.
- Head metadata on each edited route keeps its unique title/description and
  existing OG/Twitter/canonical tags; only wording changes.
- Appeal text saved as a document you can copy, not shipped into the app.
- Verify after: typecheck, then load `/`, `/about`, `/pricing` in the preview
  to confirm rendering and no console errors.
