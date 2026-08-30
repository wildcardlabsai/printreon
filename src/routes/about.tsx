import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { PartnerStrip } from "@/components/PartnerStrip";
import { SITE_URL } from "@/lib/site";
import { FileBox, Banknote, ShieldCheck } from "lucide-react";

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
  component: About,
});

function About() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <article className="container-page max-w-3xl py-16">
        <span className="eyebrow">// About</span>
        <h1 className="mt-4 text-4xl font-bold text-ink md:text-5xl">About Printreon</h1>
        <p className="mt-6 text-lg text-ink-soft">
          Printreon is the membership platform purpose-built for 3D printing creators —
          STL designers, miniature sculptors, cosplay makers, functional-print designers and print farms.
        </p>
        <p className="mt-4 text-ink-soft">
          Patreon was never built for STL files. We are. Native uploads for .stl, .3mf, .obj and .zip,
          tier-gated downloads, lead magnets, growth tools, and analytics that 3D creators actually need.
        </p>

        <h2 className="mt-12 text-2xl font-bold text-ink">Why we built this</h2>
        <p className="mt-3 text-ink-soft">
          Every general-purpose membership platform treats a 3D model the same way it treats a podcast
          episode or a blog post — as a generic attachment. It isn't. A file needs a viewer, not just a
          download link. A tier needs to gate a .zip the same way it gates a .stl. A creator needs payouts
          that land in days, not the 60-day holds video platforms are built around.
        </p>
        <p className="mt-3 text-ink-soft">
          We kept hearing the same workaround from designers: Drive links pasted into Discord, tier gating
          held together with spreadsheets, no real way to license a file for commercial print farms versus
          hobbyists. So we built the platform we wished existed — STL-native from day one, with the
          payments, licensing, and community tools this economy actually runs on.
        </p>

        <h2 className="mt-12 text-2xl font-bold text-ink">Our partner</h2>
        <div className="mt-4">
          <PartnerStrip variant="compact" />
        </div>
        <p className="mt-3 text-ink-soft">
          Together we connect designers and makers across the entire print workflow — from the file you
          publish on Printreon to the print sitting on someone's bed.
        </p>

        <h2 className="mt-12 text-2xl font-bold text-ink">Mission</h2>
        <p className="mt-3 text-ink-soft">
          Give every 3D creator a fair, predictable monthly income — without giving up control of their
          files, audience, or brand.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="card-soft !p-4">
            <FileBox className="h-5 w-5 text-primary" />
            <p className="mt-2 text-sm font-semibold text-ink">Your files, protected</p>
            <p className="mt-1 text-xs text-ink-soft">Every download is verified by tier, every time.</p>
          </div>
          <div className="card-soft !p-4">
            <Banknote className="h-5 w-5 text-primary" />
            <p className="mt-2 text-sm font-semibold text-ink">Your money, direct</p>
            <p className="mt-1 text-xs text-ink-soft">Stripe Connect pays your own bank account.</p>
          </div>
          <div className="card-soft !p-4">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <p className="mt-2 text-sm font-semibold text-ink">Your audience, owned</p>
            <p className="mt-1 text-xs text-ink-soft">No algorithm between you and your subscribers.</p>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-ink-soft">
            We're accepting founding-creator applications now — <b className="font-semibold text-ink">300+ creators</b> already on the list.
          </p>
          <Link to="/auth" search={{ mode: "signup", as: "creator" }} className="btn-primary ml-auto">Start as a creator</Link>
        </div>
      </article>

      <SiteFooter />
    </div>
  );
}
