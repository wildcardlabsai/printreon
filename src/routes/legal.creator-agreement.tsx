import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/legal/creator-agreement")({
  head: () => ({ meta: [{ title: "Creator Agreement — MakerMind Club" }, { name: "description", content: "Terms specific to creators on MakerMind Club." }] }),
  component: () => (
    <article className="text-ink">
      <h1>Creator Agreement</h1>
      <p>This Creator Agreement supplements the Terms of Service.</p>
      <h2>Ownership</h2>
      <p>You retain all rights to your STL, 3MF, OBJ and ZIP files. We host them on your behalf.</p>
      <h2>Platform fee</h2>
      <p>MakerMind Club retains a small platform fee on paid subscriptions (default 10%). Stripe processing fees apply separately. Free files are always free to distribute.</p>
      <h2>Payouts</h2>
      <p>Payouts are made via Stripe Connect to your linked account on a recurring schedule.</p>
      <h2>Content responsibility</h2>
      <p>You confirm you have the right to distribute every file you upload. Commercial-license tiers must be clearly labeled.</p>
      <h2>Termination</h2>
      <p>You can withdraw your files at any time. We may remove content that violates our Terms or this Agreement.</p>
    </article>
  ),
});
