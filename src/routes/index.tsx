import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

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
      { title: "Printreon | Buy and Sell Licensed 3D Printable Files" },
      {
        name: "description",
        content:
          "Printreon is a digital marketplace for 3D printable files. Designers sell licensed STL, 3MF, OBJ and ZIP downloads on a monthly subscription, delivered instantly through protected links.",
      },
      { property: "og:title", content: "Printreon — Licensed 3D Printable File Downloads" },
      {
        property: "og:description",
        content:
          "A digital-goods marketplace for 3D printing. Licensed STL, 3MF, OBJ and ZIP downloads from approved designers, delivered instantly. Invite-only beta.",
      },
      { property: "og:url", content: SITE_URL },
      { property: "og:type", content: "website" },
      { property: "og:image", content: `${SITE_URL}/og-image.jpg` },
      { name: "twitter:image", content: `${SITE_URL}/og-image.jpg` },
      { name: "twitter:card", content: "summary_large_image" },

      { name: "twitter:title", content: "Printreon — Licensed 3D Printable File Downloads" },
      {
        name: "twitter:description",
        content: "Licensed STL, 3MF, OBJ and ZIP downloads from approved 3D designers, delivered instantly.",
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
      <Compare />
      <QualityBar />
      <Money />
      <PricingAndFaq />
      <Apply />
      <SiteFooter />
      <StickyApply />
    </div>
  );
}

/** True once the viewport is at desktop width. Starts false so SSR matches mobile. */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

/** Slim bar that appears once the hero has scrolled away, so applying is always one tap. */
function StickyApply() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const nearBottom = y + window.innerHeight > document.body.scrollHeight - 700;
      setShow(y > 700 && !nearBottom);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur transition-transform duration-200 md:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <p className="min-w-0 flex-1 text-xs text-ink-soft">
          Beta is invite-only. Batch 001 is open.
        </p>
        <a href="#apply" className="btn-primary h-10 shrink-0 px-4 text-sm">
          Apply
        </a>
      </div>
    </div>
  );
}


/* --------------------------------- 1. HERO -------------------------------- */

function Hero() {
  const discoveryEnabled = useDiscoveryEnabled();
  return (
    <section className="facet-bg relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 blueprint-grid opacity-50" aria-hidden />
      <div className="container-wide relative grid gap-10 py-12 md:grid-cols-12 md:items-center md:gap-12 md:py-20">
        <div className="md:col-span-6">
          <h1 className="text-[32px] font-bold leading-[1.06] text-ink sm:text-[38px] md:text-[58px]">
            Licensed 3D printable files, sold by subscription.
          </h1>
          <p className="mt-4 max-w-lg text-base text-ink-soft md:text-lg">
            Printreon is a digital marketplace for 3D printing. Approved designers publish STL, 3MF,
            OBJ and ZIP files to a gated library, buyers pay a monthly price for licensed access, and
            every download is delivered instantly through a protected link.
          </p>

          {/* On phones the product shot comes before the detail, so the first scroll shows the app. */}
          <div className="mt-7 md:hidden">
            <MockStudioOverview />
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card/70 p-4">
              <h2 className="text-sm font-bold text-ink">You design models</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Sell your files: a storefront page, subscription pricing, a licensed file library and
                Stripe payouts.
              </p>
              <a href="#apply" className="btn-primary mt-3 h-11 w-full px-5 text-sm">
                Apply as a creator
              </a>
            </div>
            <div className="rounded-2xl border border-border bg-card/70 p-4">
              <h2 className="text-sm font-bold text-ink">You print them</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Subscribe to the designers you like and download their files any time.
              </p>
              {discoveryEnabled ? (
                <Link to="/explore" className="btn-ghost mt-3 h-11 w-full px-5 text-sm">
                  Browse creators
                </Link>
              ) : (
                <Link to="/auth" search={{ mode: "signup" }} className="btn-ghost mt-3 h-11 w-full px-5 text-sm">
                  Create a free account
                </Link>
              )}
            </div>
          </div>

          <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
            10% platform fee · Stripe payouts · Free to open a page
          </p>
        </div>

        <div className="hidden md:col-span-6 md:block">
          <MockStudioOverview />
          <p className="mt-3 text-center font-mono text-[11px] uppercase tracking-widest text-ink-soft">
            Creator dashboard
          </p>
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
          <div className="grid gap-5 sm:grid-cols-2">
            <MockCaption label="Your file library" className="sm:col-span-2">
              <MockFileLibrary />
            </MockCaption>
            <MockCaption label="Your tiers">
              <MockTiers />
            </MockCaption>
            <MockCaption label="What a supporter sees">
              <MockSupporterLibrary />
            </MockCaption>
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

/** Labels a product mockup so it reads as a real screen rather than decoration. */
function MockCaption({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <figure className={className}>
      {children}
      <figcaption className="mt-2 font-mono text-[11px] uppercase tracking-widest text-ink-soft">
        {label}
      </figcaption>
    </figure>
  );
}

/* ----------------------------- 3b. WHAT'S DIFFERENT ----------------------- */

const DIFFERENCES = [
  {
    title: "Built around the file, not the post",
    body: "Tier gating sits on the model itself, so access is decided per file rather than per announcement.",
  },
  {
    title: "Previews before download",
    body: "STL, 3MF and OBJ render in the browser, with dimensions, triangle count and your print settings attached.",
  },
  {
    title: "Versions instead of duplicates",
    body: "Upload a fix as v2 with a changelog. Links keep working and supporters get told what changed.",
  },
  {
    title: "Files that stay behind the paywall",
    body: "Private storage and short-lived signed links, not a shared drive folder that outlives the subscription.",
  },
] as const;

function Compare() {
  return (
    <section className="container-wide py-16 md:py-20">
      <span className="eyebrow">// Why not a drive folder</span>
      <h2 className="mt-4 max-w-2xl text-3xl font-bold text-ink md:text-4xl">
        What you get that a posts-and-links setup cannot do.
      </h2>
      <div className="mt-9 grid gap-x-10 gap-y-8 sm:grid-cols-2">
        {DIFFERENCES.map((d) => (
          <div key={d.title} className="border-l-2 border-primary/40 pl-4">
            <h3 className="font-bold text-ink">{d.title}</h3>
            <p className="mt-1 text-sm text-ink-soft">{d.body}</p>
          </div>
        ))}
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
        <EarningsCalculator />
        <p className="mt-6 text-sm text-background/50">
          Stripe's own processing fee applies on top, the same as it would anywhere else.
        </p>
      </div>
    </section>
  );
}

/** Simple worked example so the 10% fee has a number attached to it. */
function EarningsCalculator() {
  const [supporters, setSupporters] = useState(100);
  const [price, setPrice] = useState(5);

  const { gross, fee, net } = useMemo(() => {
    const g = supporters * price;
    const f = g * 0.1;
    return { gross: g, fee: f, net: g - f };
  }, [supporters, price]);

  return (
    <div className="mt-10 rounded-2xl border border-background/15 bg-background/5 p-5 md:p-6">
      <h3 className="font-mono text-xs uppercase tracking-widest text-background/50">
        What that looks like
      </h3>
      <div className="mt-4 grid gap-6 md:grid-cols-2 md:items-center">
        <div className="space-y-5">
          <label className="block">
            <span className="flex items-baseline justify-between text-sm text-background/70">
              Supporters <span className="font-bold text-background">{supporters}</span>
            </span>
            <input
              type="range"
              min={10}
              max={1000}
              step={10}
              value={supporters}
              onChange={(e) => setSupporters(Number(e.target.value))}
              className="mt-2 w-full accent-primary"
              aria-label="Number of supporters"
            />
          </label>
          <label className="block">
            <span className="flex items-baseline justify-between text-sm text-background/70">
              Monthly price <span className="font-bold text-background">£{price}</span>
            </span>
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="mt-2 w-full accent-primary"
              aria-label="Monthly tier price in pounds"
            />
          </label>
        </div>
        <div className="rounded-xl bg-background/10 p-5">
          <p className="text-sm text-background/60">
            £{gross.toLocaleString()} a month collected
          </p>
          <p className="mt-1 text-sm text-background/60">
            minus £{fee.toLocaleString()} platform fee
          </p>
          <p className="mt-3 text-3xl font-bold text-background">
            £{net.toLocaleString()} <span className="text-base font-semibold text-background/60">to you</span>
          </p>
          <p className="mt-2 text-xs text-background/50">
            Before Stripe's processing fee. Illustrative only.
          </p>
        </div>
      </div>
    </div>
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
          <Faq />
        </div>

      </div>
    </section>
  );
}

/** Collapsed on phones so the section stays scannable, open on desktop. */
function Faq() {
  const isDesktop = useIsDesktop();
  return (
    <div className="mt-6 divide-y divide-border border-y border-border">
      {FAQ_ITEMS.map((f) => (
        <details key={f.q} open={isDesktop} className="group py-4 md:py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-ink md:cursor-default">
            {f.q}
            <span className="font-mono text-primary transition-transform group-open:rotate-45 md:hidden">+</span>
          </summary>
          <p className="mt-2 text-sm text-ink-soft">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

/* --------------------------------- 7. APPLY ------------------------------- */

function Apply() {
  return (
    <section id="apply" className="border-t border-border bg-surface py-14 md:py-20">
      <div className="container-wide grid gap-10 md:grid-cols-12 md:items-start">
        <div className="md:col-span-5">
          <h2 className="text-3xl font-bold text-ink md:text-4xl">Apply for the beta</h2>
          <p className="mt-4 text-ink-soft">
            Printreon is small and invite-only while we get it right. Tell us what you make and we
            will send an invite when there is room. Supporters can join the list too.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-ink-soft">
            <li className="flex gap-3">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              We read applications weekly and invite in batches.
            </li>
            <li className="flex gap-3">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Invited creators get a setup link and keep the founding-creator fee.
            </li>
            <li className="flex gap-3">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              We only email you about Printreon. Unsubscribe any time.
            </li>
          </ul>
        </div>

        <div className="md:col-span-7">
          <WaitlistForm />
        </div>
      </div>
    </section>
  );
}
