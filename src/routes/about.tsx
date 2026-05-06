import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { PARTNER, SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Printreon" },
      { name: "description", content: "Printreon is the membership platform purpose-built for 3D printing creators. Partnered with MakerMind App." },
      { property: "og:title", content: "About Printreon" },
      { property: "og:description", content: "Built for 3D printing creators. Partnered with MakerMind App." },
      { property: "og:url", content: `${SITE_URL}/about` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/about` }],
  }),
  component: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <article className="container-page max-w-3xl py-16">
        <h1 className="text-4xl font-bold text-ink md:text-5xl">About Printreon</h1>
        <p className="mt-6 text-lg text-ink-soft">
          Printreon is the membership platform purpose-built for 3D printing creators —
          STL designers, miniature sculptors, cosplay makers, functional-print designers and print farms.
        </p>
        <p className="mt-4 text-ink-soft">
          Patreon was never built for STL files. We are. Native uploads for .stl, .3mf, .obj and .zip,
          tier-gated downloads, lead magnets, growth tools, and analytics that 3D creators actually need.
        </p>
        <h2 className="mt-10 text-2xl font-bold text-ink">Our partner</h2>
        <p className="mt-3 text-ink-soft">
          We're proudly partnered with{" "}
          <a href={PARTNER.url} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">{PARTNER.name}</a>{" "}
          — {PARTNER.tagline}. Together we connect designers and makers across the entire print workflow.
        </p>
        <h2 className="mt-10 text-2xl font-bold text-ink">Mission</h2>
        <p className="mt-3 text-ink-soft">Give every 3D creator a fair, predictable monthly income — without giving up control of their files, audience, or brand.</p>
        <div className="mt-10">
          <Link to="/auth" search={{ mode: "signup", as: "creator" }} className="btn-primary">Start as a creator</Link>
        </div>
      </article>
      <SiteFooter />
    </div>
  ),
});
