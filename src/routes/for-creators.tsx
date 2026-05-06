import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
export const Route = createFileRoute("/for-creators")({
  head: () => ({ meta: [{ title: "For Creators — Printreon" }, { name: "description", content: "Why STL designers and 3D print creators are choosing Printreon over Patreon." }] }),
  component: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container-page py-16">
        <h1 className="text-4xl font-bold text-ink md:text-5xl">For 3D print creators.</h1>
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
          ].map((f) => (
            <div key={f.title} className="card-soft">
              <h2 className="text-lg font-bold text-ink">{f.title}</h2>
              <p className="mt-1 text-sm text-ink-soft">{f.desc}</p>
            </div>
          ))}
        </div>

        <Link to="/auth" search={{ mode: "signup", as: "creator" }} className="btn-primary mt-10 inline-flex">Start as a creator</Link>
      </div>
      <SiteFooter />
    </div>
  ),
});
