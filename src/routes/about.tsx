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
          Printreon is a digital marketplace for licensed 3D printable files. Approved designers sell
          .stl, .3mf, .obj and .zip downloads to buyers on a monthly subscription.
        </p>
        <p className="mt-4 text-ink-soft">
          Nothing physical ships. Every purchase delivers digital files instantly through an expiring,
          protected download link, with a licence record attached to each file.
        </p>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold text-ink">What Printreon sells</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-soft">
            <li><strong className="text-ink">Product:</strong> licensed digital 3D model files for 3D printing (.stl, .3mf, .obj, .zip). No physical goods, no shipping.</li>
            <li><strong className="text-ink">How it is sold:</strong> a monthly subscription that licenses access to a designer's file library, plus one-off file and bundle purchases.</li>
            <li><strong className="text-ink">Delivery:</strong> instant digital delivery via expiring signed download links, with download limits and per-file licence records.</li>
            <li><strong className="text-ink">Who sells:</strong> invite-only, manually approved designers with identity-verified Stripe accounts. There is no open seller signup.</li>
            <li><strong className="text-ink">Controls:</strong> upload review for new sellers, mesh checks, AI disclosure with print-proof requirements, IP and DMCA policy, reporting and suspension.</li>
          </ul>
          <p className="mt-4 text-sm text-ink-soft">
            Full detail: <Link to="/legal/terms" className="font-semibold text-primary hover:underline">Terms of Service</Link>,{" "}
            <Link to="/legal/creator-agreement" className="font-semibold text-primary hover:underline">Creator Agreement</Link>,{" "}
            <Link to="/legal/dmca" className="font-semibold text-primary hover:underline">DMCA policy</Link>,{" "}
            <Link to="/legal/privacy" className="font-semibold text-primary hover:underline">Privacy Policy</Link>.
          </p>
        </div>

        <h2 className="mt-12 text-2xl font-bold text-ink">Why we built this</h2>
        <p className="mt-3 text-ink-soft">
          Most membership platforms treat a 3D model like any other attachment. A printable file needs
          more than that. It needs a viewer, a tier that gates a .zip the same way it gates a .stl, and
          payouts that arrive in days rather than sitting behind a two-month hold.
        </p>
        <p className="mt-3 text-ink-soft">
          Designers kept describing the same workaround: Drive links pasted into Discord, tier gating
          held together with spreadsheets, and no clean way to licence a file for a commercial print
          farm as opposed to a hobbyist. So we built the thing we wanted to use. STL-native from day
          one, with the payments, licensing and community tools this work actually runs on.
        </p>


        <h2 className="mt-12 text-2xl font-bold text-ink">Our partner</h2>
        <div className="mt-4">
          <PartnerStrip variant="compact" />
        </div>
        <p className="mt-3 text-ink-soft">
          Together we cover the whole print workflow, from the file you publish on Printreon to the
          print sitting on someone's bed.
        </p>

        <h2 className="mt-12 text-2xl font-bold text-ink">Mission</h2>
        <p className="mt-3 text-ink-soft">
          Give every 3D creator a fair, predictable monthly income, without giving up control of their
          files, audience or brand.
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
            Founding-creator applications are open. The beta is invite-only, so places go out in batches.
          </p>

          <Link to="/auth" search={{ mode: "signup", as: "creator" }} className="btn-primary ml-auto">Start as a creator</Link>
        </div>
      </article>

      <SiteFooter />
    </div>
  );
}
