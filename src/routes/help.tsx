import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

const topics = [
  { title: "Getting started as a creator", body: "Sign up, complete onboarding, add your first tier and upload an STL." },
  { title: "Uploading files (STL, 3MF, OBJ, ZIP)", body: "Use the Files tab. Set access (free, any subscriber, or specific tier)." },
  { title: "Setting up tiers", body: "Create tiers with name, monthly price and benefits. You can have unlimited tiers." },
  { title: "Getting paid (Stripe)", body: "Connect your payout account in dashboard → Payouts. Stripe Connect integration is rolling out." },
  { title: "Cancelling a subscription", body: "Members → My subscriptions → Cancel. You keep access until the period ends." },
  { title: "Reporting a file or creator", body: "Use the Report button on the file or creator page. Admins review within 48h." },
];

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [{ title: "Help — MakerMind Club" }, { name: "description", content: "Help and FAQs." }] }),
  component: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container-page max-w-3xl py-16">
        <h1 className="text-4xl font-bold text-ink">Help Center</h1>
        <p className="mt-3 text-ink-soft">Common questions. Need more? <Link to="/contact" className="text-primary">Contact us</Link>.</p>
        <div className="mt-8 space-y-3">
          {topics.map((t) => (
            <details key={t.title} className="group card-soft">
              <summary className="cursor-pointer list-none font-semibold text-ink">{t.title}</summary>
              <p className="mt-2 text-ink-soft">{t.body}</p>
            </details>
          ))}
        </div>
      </div>
      <SiteFooter />
    </div>
  ),
});
