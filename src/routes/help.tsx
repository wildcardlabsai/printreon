import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

const topics = [
  { title: "Getting started as a creator", body: "Sign up, complete onboarding, add your first tier and upload an STL." },
  { title: "Uploading files (STL, 3MF, OBJ, ZIP)", body: "Use the Files tab. Set access (free, any subscriber, or specific tier)." },
  { title: "Setting up tiers", body: "Create tiers with name, monthly price and benefits. You can have unlimited tiers." },
  { title: "Getting paid (Stripe Connect)", body: "Go to dashboard → Payouts and click Connect payout account. Stripe handles identity verification and bank details. Once your status is Active, subscriber payments are automatically routed to you, minus the platform fee." },
  { title: "Upgrading or downgrading a tier", body: "Members can switch tiers at any time from My subscriptions. The change is immediate and Stripe automatically prorates the difference." },
  { title: "Cancelling a subscription", body: "Members → My subscriptions → Cancel. You keep access until the end of the current billing period, then access is revoked automatically." },
  { title: "Email notifications", body: "When a creator you subscribe to or follow uploads a new file or post, you'll get an email so you never miss a drop. You can manage notification preferences in account settings." },
  { title: "Reporting a file or creator", body: "Use the Report button on the file or creator page. Admins review within 48h." },
  { title: "What do the file badges mean?", body: "Print-Tested — the creator physically printed the model and attached a photo of the real print. Digital Sculpt — hand-crafted digitally, watertight (manifold) and scaled for slicers, but not yet test-printed. AI-Assisted — 3D AI tools were used somewhere in the process, disclosed up front. Falsifying a badge is a Terms violation and can get a file removed or an account suspended." },
  { title: "What is Printreon's policy on AI-generated models?", body: "We discourage leaning on AI, but we don't ban it — plenty of AI-assisted models print perfectly well. If AI was used anywhere, disclose it with the AI-Assisted badge. If you refined the mesh by hand (repair, retopology, manifold check, slicer scaling), that's enough to publish. If the file is essentially straight AI output with little or no manual work, you must physically print it and attach a photo of the real print first — proof it's an actual printable file. What we won't host is untested AI output dumped straight from a generator: those get removed." },
  { title: "Can I sell here if I don't own a 3D printer?", body: "Yes. Publish under the Digital Sculpt badge. Your geometry still has to be watertight, free of non-manifold edges and inverted normals, and properly scaled for standard slicers. Once you (or a test printer) print it, add a photo and the file upgrades to Print-Tested." },
  { title: "How do I earn the Print-Tested badge?", body: "Upload a photo of the finished physical print from your Files tab. The photo is shown to buyers alongside the badge, so it has to be your actual print of that model." },
  { title: "How does Printreon stop unprintable files?", body: "Every upload runs an automatic mesh sanity check (triangle count, dimensions, scale, suspicious geometry) before it can be published, new creators have their first files reviewed by a human, buyers report whether a model printed successfully, and badge fraud is a suspendable offence." },
];

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [{ title: "Help — Printreon" }, { name: "description", content: "Help and FAQs." }] }),
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
