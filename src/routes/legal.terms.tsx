import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/legal/terms")({
  head: () => ({ meta: [{ title: "Terms of Service — Printreon" }, { name: "description", content: "Terms of Service for Printreon (printreon.com)." }] }),
  component: () => (
    <article className="text-ink">
      <h1>Terms of Service</h1>
      <p>Last updated: May 2026</p>
      <p>Welcome to Printreon ("Printreon", "we", "us"), operating at printreon.com. By using our platform you agree to these terms.</p>
      <h2>1. Accounts</h2>
      <p>You must be 18+ to create a creator account. You are responsible for keeping credentials secure.</p>
      <h2>2. Creator content</h2>
      <p>You retain ownership of all 3D files and content you upload. You grant Printreon a worldwide, non-exclusive license to host, display and distribute that content to your subscribers.</p>
      <h2>3. Subscriptions &amp; payments</h2>
      <p>Subscriptions are processed by Stripe. Members may cancel anytime; access continues until the end of the paid period. Creators receive payouts net of platform fees.</p>
      <h2>4. Prohibited content</h2>
      <p>No infringing, illegal, harmful or offensive content. We will remove content and terminate accounts that violate these terms.</p>
      <h2>5. Termination</h2>
      <p>We may suspend or terminate accounts that violate these terms. You may delete your account at any time.</p>
      <h2>6. Disclaimers &amp; liability</h2>
      <p>Service is provided "as is". To the maximum extent permitted by law, Printreon disclaims all warranties and limits liability to fees paid in the prior 12 months.</p>
      <h2>7. Contact</h2>
      <p>legal@printreon.com</p>
    </article>
  ),
});
