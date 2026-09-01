import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

const STEPS = [
  { n: "01", title: "Set up your page", desc: "Display name, slug, banner, tiers and pricing — live in minutes." },
  { n: "02", title: "Upload your files", desc: "STL, 3MF, OBJ or ZIP, gated to whichever tier you choose." },
  { n: "03", title: "Get paid monthly", desc: "Stripe Connect handles billing, taxes and payouts to your bank." },
] as const;

export const Route = createFileRoute("/for-creators")({
  head: () => ({ meta: [{ title: "For Creators — Printreon" }, { name: "description", content: "Why STL designers and 3D print creators are choosing Printreon over Patreon." }] }),
  component: ForCreators,
});

function ForCreators() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container-page py-16">
        <span className="eyebrow">// For creators</span>
        <h1 className="mt-4 text-4xl font-bold text-ink md:text-5xl">For 3D print creators.</h1>
        <p className="mt-4 max-w-2xl text-ink-soft">Native STL, 3MF, OBJ and ZIP support. Tiered memberships. Built-in growth loops. Everything you'd hack onto Patreon — built in by default.</p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {[
            { title: "Tiered memberships", desc: "Unlimited tiers with their own price and gated benefits." },
            { title: "Native STL / 3MF / OBJ / ZIP", desc: "Real 3D-aware uploads with previews, tags and tier-gated downloads." },
            { title: "Embedded Stripe checkout", desc: "Subscribers check out without ever leaving your page." },
            { title: "Stripe Connect payouts", desc: "Money lands in your own bank account. We take a small platform fee per paid subscription." },
            { title: "Auto-emails on new drops", desc: "Subscribers and followers get an email the moment you publish a new file or post." },
            { title: "Posts, comments & DMs", desc: "Build a real community around your prints — not just a paywall." },
            { title: "Bundles & promo codes", desc: "Run launches, sales and bundles without duct-taping third-party tools." },
            { title: "Creator analytics", desc: "Revenue, MRR, downloads, conversion and follower-to-sub data." },
            { title: "Honest quality badges", desc: "Print-Tested, Digital Sculpt or AI-Assisted on every file — so buyers trust what they download." },
            { title: "No untested AI dumps", desc: "AI is allowed but must be disclosed, and unrefined AI models need a real print photo. Your work isn't buried under unprintable junk." },
          ].map((f) => (
            <div key={f.title} className="card-soft">
              <h2 className="text-lg font-bold text-ink">{f.title}</h2>
              <p className="mt-1 text-sm text-ink-soft">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-3xl border border-border bg-surface p-8">
          <span className="eyebrow">// Quality standards</span>
          <h2 className="mt-4 text-2xl font-bold text-ink">We're strict, on purpose.</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft">
            Raw, unedited AI mesh dumps are prohibited. Every upload runs an automatic mesh sanity check, and your first
            files are reviewed by a human before they go live. Print your model and attach a photo to earn the
            <strong className="text-ink"> Print-Tested</strong> badge; no printer of your own? Publish as
            <strong className="text-ink"> Digital Sculpt</strong> as long as the geometry is watertight and slicer-scaled.
            Used AI anywhere? Refine it by hand and disclose it as <strong className="text-ink">AI-Assisted</strong>.
          </p>
          <Link to="/legal/terms" hash="quality" className="mt-4 inline-block text-sm text-primary underline underline-offset-4">Read the full quality &amp; AI policy</Link>
        </div>

        <div className="mt-16 border-t border-border pt-12">
          <span className="eyebrow">// How it works</span>
          <h2 className="mt-4 text-2xl font-bold text-ink md:text-3xl">From blank page to paid, in three steps.</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="card-soft">
                <span className="font-mono text-xs font-semibold text-primary">Step {s.n}</span>
                <h3 className="mt-2 text-lg font-bold text-ink">{s.title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start gap-4 rounded-3xl border border-primary/20 bg-primary/5 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink">Founding creators keep higher payouts for life.</h2>
            <p className="mt-1 max-w-lg text-sm text-ink-soft">Creators accepted into the beta permanently lock in a reduced platform fee — before the doors open to everyone else.</p>
          </div>
          <Link to="/auth" search={{ mode: "signup", as: "creator" }} className="btn-primary shrink-0">Start as a creator</Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
