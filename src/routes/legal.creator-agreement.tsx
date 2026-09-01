import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/legal/creator-agreement")({
  head: () => ({ meta: [{ title: "Creator Agreement — Printreon" }, { name: "description", content: "Terms specific to creators on Printreon." }] }),
  component: () => (
    <article className="text-ink">
      <h1>Creator Agreement</h1>
      <p>This Creator Agreement supplements the <a href="/legal/terms">Terms of Service</a>, including the Quality &amp; File Integrity Standards in section 3.</p>
      <h2>Ownership</h2>
      <p>You retain all rights to your STL, 3MF, OBJ and ZIP files. We host them on your behalf.</p>
      <h2>Platform fee</h2>
      <p>Printreon retains a small platform fee on paid subscriptions (default 10%). Stripe processing fees apply separately. Free files are always free to distribute.</p>
      <h2>Payouts</h2>
      <p>Payouts are made via Stripe Connect to your linked account on a recurring schedule.</p>
      <h2>Quality standards &amp; badges</h2>
      <p>Every file you publish must carry an accurate badge: <strong>Print-Tested</strong> (physically printed by you or an authorised test printer, with photo proof), <strong>Digital Sculpt</strong> (hand-crafted digitally, watertight and slicer-scaled, not yet test-printed) or <strong>AI-Assisted</strong> (AI base, manually retopologised, repaired and refined). Misrepresenting an unprinted file as Print-Tested is a breach of this Agreement.</p>
      <h2>No raw AI output</h2>
      <p>Direct, unedited or automated exports from text-to-3D or image-to-3D tools are strictly prohibited. Anything you publish must be manually repaired, manifold-verified and scaled for standard slicers. Files that fail these standards will be removed, and repeat breaches will end your creator account.</p>
      <h2>Content responsibility</h2>
      <p>You confirm you have the right to distribute every file you upload. Commercial-license tiers must be clearly labeled.</p>
      <h2>Termination</h2>
      <p>You can withdraw your files at any time. We may remove content that violates our Terms or this Agreement.</p>
    </article>
  ),
});
