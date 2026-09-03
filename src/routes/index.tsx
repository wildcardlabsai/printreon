import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { WaitlistForm } from "@/components/WaitlistForm";
import { useDiscoveryEnabled } from "@/lib/use-discovery";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";
import {
  MockStudioOverview,
  MockFileLibrary,
  MockTiers,
  MockSupporterLibrary,
} from "@/components/landing/DashboardMocks";
import { Check, Lock, Upload, CreditCard, Download, Layers } from "lucide-react";


const FAQ_ITEMS = [
  {
    q: "What file types can I sell?",
    a: "STL, 3MF, OBJ and ZIP archives. Files are stored privately and delivered through expiring signed links, not public URLs.",
  },
  {
    q: "What does it cost?",
    a: "Nothing to open a page. Printreon takes 10% of paid subscription revenue. Stripe's own processing fee applies on top, as it does anywhere.",
  },
  {
    q: "How do I get paid?",
    a: "Through Stripe Connect, into your own bank account. You onboard with Stripe directly and payouts run on their schedule.",
  },
  {
    q: "Can I give files away free?",
    a: "Yes. Any file can be marked free, with no tier required.",
  },
  {
    q: "What is the policy on AI?",
    a: "AI is allowed but must be disclosed. Hand-refined models publish normally as AI-Assisted. A model that is essentially raw AI output has to be printed, with a photo attached, before it goes live.",
  },
  {
    q: "Can supporters cancel?",
    a: "Any time, through the Stripe customer portal. Access runs to the end of the paid period and then stops.",
  },
] as const;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Printreon | Sell STL Files by Monthly Membership" },
      {
        name: "description",
        content:
          "Printreon is a membership platform for 3D print creators. Set tiers, upload STL, 3MF, OBJ and ZIP files, and get paid monthly through Stripe.",
      },
      { property: "og:title", content: "Printreon — Sell STL Files by Monthly Membership" },
      {
        property: "og:description",
        content:
          "Creator pages, membership tiers and protected STL delivery, built for 3D print designers. Invite-only beta.",
      },
      { property: "og:url", content: SITE_URL },
      { property: "og:type", content: "website" },
      { property: "og:image", content: `${SITE_URL}/og-image.jpg` },
      { name: "twitter:image", content: `${SITE_URL}/og-image.jpg` },
      { name: "twitter:card", content: "summary_large_image" },

      { name: "twitter:title", content: "Printreon — Sell STL Files by Monthly Membership" },
      {
        name: "twitter:description",
        content: "Creator pages, membership tiers and protected STL delivery for 3D print designers.",
      },
      {
        "script:ld+json": {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: SITE_NAME,
          url: SITE_URL,
          description: SITE_DESCRIPTION,
        },
      },
      {
        "script:ld+json": {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ_ITEMS.map(({ q, a }) => ({
            "@type": "Question",
            name: q,
            acceptedAnswer: { "@type": "Answer", text: a },
          })),
        },
      },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Hero />
      <div id="features" />
      <TheProduct />
      <HowItWorks />
      <QualityBar />
      <Money />
      <PricingAndFaq />
      <Apply />
      <SiteFooter />
    </div>
  );
}

/* --------------------------------- 1. HERO -------------------------------- */

function Hero() {
  const discoveryEnabled = useDiscoveryEnabled();
  return (
    <section className="facet-bg relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 blueprint-grid opacity-50" aria-hidden />
      <div className="container-wide relative grid gap-12 py-16 md:grid-cols-12 md:items-center md:py-20">
        <div className="md:col-span-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
            BATCH 001 <span className="text-primary">///</span> BETA OPEN <span className="text-primary">///</span> INVITE ONLY
          </p>

          <h1 className="mt-5 text-[38px] font-bold leading-[1.05] text-ink md:text-[58px]">
            A membership home for 3D print creators.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-ink-soft">
            Set your tiers, upload your STL, 3MF, OBJ and ZIP files, and let supporters pay you monthly
            for access. Printreon handles the page, the paywall, the file delivery and the payouts.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href="#apply" className="btn-primary h-12 px-6 text-base">
              Apply as a creator
            </a>
            {discoveryEnabled ? (
              <Link to="/explore" className="btn-ghost h-12 px-6 text-base">
                Browse creators
              </Link>
            ) : (
              <Link to="/auth" search={{ mode: "signup" }} className="btn-ghost h-12 px-6 text-base">
                Create a free account
              </Link>
            )}
          </div>
          <p className="mt-5 font-mono text-xs uppercase tracking-widest text-ink-soft">
            10% platform fee · Stripe payouts · Free to open a page
          </p>
        </div>

        <div className="md:col-span-6">
          <MockStudioOverview />
        </div>

      </div>
    </section>
  );
}

/* ------------------------------ 2. THE PRODUCT ---------------------------- */

const PRODUCT_POINTS = [
  {
    title: "Your creator page",
    body: "A public page with your banner, bio, tiers and file library. One link to send anywhere.",
  },
  {
    title: "Tiers you control",
    body: "As many as you like, each with its own price and its own gated files. Monthly or annual.",
  },
  {
    title: "A real file library",
    body: "STL, 3MF, OBJ and ZIP with in-browser previews, tags, print settings and version notes.",
  },
  {
    title: "Downloads that stay yours",
    body: "Files live in private storage. Supporters get short-lived signed links, so nothing leaks to a public URL.",
  },
] as const;

function TheProduct() {
  return (
    <section className="container-wide py-16 md:py-20">
      <div className="grid gap-12 md:grid-cols-12 md:items-center">
        <div className="md:col-span-5">
          <span className="eyebrow">// The product</span>
          <h2 className="mt-4 text-3xl font-bold text-ink md:text-4xl">
            One page. Your tiers. Your files behind them.
          </h2>
          <p className="mt-4 text-ink-soft">
            Patreon was built for posts and video. Printreon is built around the thing you actually
            ship: a printable file, in a format a slicer understands, delivered to the people paying
            for it.
          </p>
          <ul className="mt-7 space-y-5">
            {PRODUCT_POINTS.map((p) => (
              <li key={p.title} className="flex gap-3">
                <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <h3 className="font-bold text-ink">{p.title}</h3>
                  <p className="text-sm text-ink-soft">{p.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <MockFileLibrary />
            </div>
            <MockTiers />
            <MockSupporterLibrary />
          </div>
        </div>

      </div>
    </section>
  );
}

/* ------------------------------ 3. HOW IT WORKS --------------------------- */

const STEPS = [
  { icon: Layers, n: "01", title: "Set your tiers", body: "Name them, price them, decide what each one unlocks." },
  { icon: Upload, n: "02", title: "Upload your files", body: "STL, 3MF, OBJ or ZIP, with previews and print settings." },
  { icon: CreditCard, n: "03", title: "Supporters subscribe", body: "Stripe checkout runs on your page. Cards, wallets, taxes handled." },
  { icon: Download, n: "04", title: "They download", body: "Signed links open instantly for the tiers you granted." },
] as const;

function HowItWorks() {
  return (
    <section className="border-y border-border bg-surface py-14">
      <div className="container-wide">
        <h2 className="text-2xl font-bold text-ink md:text-3xl">How it works</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="border-t-2 border-primary/40 pt-4">
              <s.icon className="h-5 w-5 text-primary" />
              <span className="mt-3 block font-mono text-xs font-semibold text-ink-soft">{s.n}</span>
              <h3 className="mt-1 text-lg font-bold text-ink">{s.title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ 4. QUALITY BAR ---------------------------- */

const BADGES = [
  { name: "Print-Tested", body: "The creator printed it and attached a photo of the result." },
  { name: "Digital Sculpt", body: "Modelled by hand, watertight and slicer-scaled, not yet printed." },
  { name: "AI-Assisted", body: "AI was used somewhere in the process, and the creator said so." },
] as const;

function QualityBar() {
  return (
    <section className="container-wide py-16 md:py-20">
      <div className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <span className="eyebrow">// Quality</span>
          <h2 className="mt-4 text-3xl font-bold text-ink md:text-4xl">
            Every file says how it was made.
          </h2>
          <p className="mt-4 text-ink-soft">
            Marketplaces are filling up with untested models that never open in a slicer. Printreon
            takes the other side of that. Uploads run a mesh sanity check, your first files are
            reviewed by a person, and every model carries a badge that tells buyers exactly what they
            are getting.
          </p>
          <p className="mt-4 text-ink-soft">
            AI is allowed and has to be disclosed. If a model is essentially raw AI output, it needs a
            print photo before it can be published.
          </p>
          <Link
            to="/legal/terms"
            hash="quality"
            className="mt-5 inline-block text-sm text-primary underline underline-offset-4"
          >
            Read the quality and AI policy
          </Link>
        </div>
        <div className="md:col-span-7 md:pt-14">
          <div className="grid gap-4 sm:grid-cols-3">
            {BADGES.map((b) => (
              <div key={b.name} className="card-soft">
                <h3 className="font-mono text-sm font-bold uppercase tracking-wide text-primary">{b.name}</h3>
                <p className="mt-2 text-sm text-ink-soft">{b.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-border bg-surface p-5">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm text-ink-soft">
              Buyers can report a failed print. Enough reports and the file goes back to review, so a
              bad model does not sit there collecting subscriptions.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- 5. MONEY ------------------------------- */

const FIGURES = [
  { k: "Platform fee", v: "10%", note: "On paid subscription revenue only." },
  { k: "Cost to open a page", v: "£0", note: "No monthly fee, no upload limit." },
  { k: "Payouts", v: "Stripe Connect", note: "Straight to your own bank account." },
  { k: "Billing options", v: "Monthly or annual", note: "Upgrades switch immediately and prorate." },
] as const;

function Money() {
  return (
    <section className="border-y border-border bg-ink py-14 text-background">
      <div className="container-wide">
        <h2 className="text-2xl font-bold text-background md:text-3xl">The money part</h2>
        <p className="mt-3 max-w-xl text-background/70">
          You are paid by Stripe, not by us. We take a cut of paid subscriptions and nothing else.
        </p>
        <dl className="mt-9 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {FIGURES.map((f) => (
            <div key={f.k}>
              <dt className="font-mono text-xs uppercase tracking-widest text-background/50">{f.k}</dt>
              <dd className="mt-2 text-2xl font-bold">{f.v}</dd>
              <p className="mt-1 text-sm text-background/60">{f.note}</p>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-sm text-background/50">
          Stripe's own processing fee applies on top, the same as it would anywhere else.
        </p>
      </div>
    </section>
  );
}

/* ----------------------------- 6. PRICING + FAQ --------------------------- */

function PricingAndFaq() {
  return (
    <section id="pricing" className="container-wide py-16 md:py-20">
      <div className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <h2 className="text-3xl font-bold text-ink md:text-4xl">Pricing</h2>
          <div className="mt-6 space-y-4">
            <div className="card-soft">
              <h3 className="text-lg font-bold text-ink">Creators</h3>
              <p className="mt-1 text-3xl font-bold text-ink">Free to start</p>
              <p className="mt-2 text-sm text-ink-soft">
                Unlimited tiers and uploads. Printreon keeps 10% of paid subscription revenue.
              </p>
            </div>
            <div className="card-soft">
              <h3 className="text-lg font-bold text-ink">Supporters</h3>
              <p className="mt-1 text-3xl font-bold text-ink">£0</p>
              <p className="mt-2 text-sm text-ink-soft">
                Free account. You only pay the creators you choose to subscribe to, and you can cancel
                whenever you like.
              </p>
            </div>
            <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5">
              <h3 className="font-bold text-ink">Founding creators</h3>
              <p className="mt-1 text-sm text-ink-soft">
                Creators accepted during the beta keep a reduced platform fee permanently. The exact
                figure is confirmed in your invite.
              </p>
            </div>
          </div>
        </div>

        <div className="md:col-span-7">
          <h2 className="text-3xl font-bold text-ink md:text-4xl">Questions</h2>
          <dl className="mt-6 divide-y divide-border border-y border-border">
            {FAQ_ITEMS.map((f) => (
              <div key={f.q} className="py-5">
                <dt className="font-bold text-ink">{f.q}</dt>
                <dd className="mt-2 text-sm text-ink-soft">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- 7. APPLY ------------------------------- */

function Apply() {
  return (
    <section id="apply" className="border-t border-border bg-surface py-16 md:py-20">
      <div className="container-wide grid gap-10 md:grid-cols-12 md:items-start">
        <div className="md:col-span-5">
          <h2 className="text-3xl font-bold text-ink md:text-4xl">Apply for the beta</h2>
          <p className="mt-4 text-ink-soft">
            Printreon is small and invite-only while we get it right. Tell us what you make and we
            will send an invite when there is room. Supporters can join the list too.
          </p>
        </div>
        <div className="md:col-span-7">
          <WaitlistForm />
        </div>
      </div>
    </section>
  );
}
