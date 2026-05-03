import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/legal/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — MakerMind Club" }, { name: "description", content: "How MakerMind Club collects and uses your data." }] }),
  component: () => (
    <article className="text-ink">
      <h1>Privacy Policy</h1>
      <p>Last updated: May 2026</p>
      <p>MakerMind Club (makermind.club) respects your privacy. This policy explains what we collect and why.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Account info: email, name, avatar</li>
        <li>Creator info: bio, social links, payout details</li>
        <li>Usage data: pages viewed, downloads, IP address</li>
        <li>Payment data: handled by Stripe — we do not store card details</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To run the service (logins, downloads, subscriptions)</li>
        <li>To send transactional emails</li>
        <li>To prevent abuse and enforce our terms</li>
      </ul>
      <h2>Sharing</h2>
      <p>We share data with payment processors (Stripe), email providers and infrastructure providers. We never sell personal data.</p>
      <h2>Your rights</h2>
      <p>You can access, export or delete your data anytime. Contact privacy@makermind.club.</p>
      <h2>Cookies</h2>
      <p>We use essential cookies for authentication and minimal analytics.</p>
    </article>
  ),
});
