import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { PartnerStrip } from "@/components/PartnerStrip";
import { SITE_URL } from "@/lib/site";
import heroImg from "@/assets/hero.jpg";
import {
  Layers, Lock, Sparkles, TrendingUp, Share2, Wallet,
  Upload, CreditCard, Rocket, ArrowRight, Check, Box,
  Mail, MessageSquare, Heart, Tag, Gift, Package, BarChart3,
  Bell, Banknote, ShieldCheck, Users, FileBox, Hammer, Megaphone,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Printreon — Turn Your 3D Print Files Into Monthly Income" },
      { name: "description", content: "Printreon gives 3D creators a simple way to sell STL, 3MF and printable files through monthly memberships. The Patreon alternative built for 3D printing. Partnered with MakerMind App." },
      { property: "og:title", content: "Printreon — Memberships for 3D Print Creators" },
      { property: "og:description", content: "Sell STL, 3MF and printable files through monthly memberships." },
      { property: "og:url", content: SITE_URL },
      { property: "og:type", content: "website" },
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
      <PartnerStrip />
      <BuiltFor />
      <HowItWorks />
      <WhyCreators />
      <EverythingIncluded />
      <PaymentsAndPayouts />
      <CommunityFeatures />
      <ForSupporters />
      <GrowthTools />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="facet-bg relative overflow-hidden">
      <div className="container-page grid gap-12 py-20 md:grid-cols-2 md:items-center md:py-28">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-ink-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Built for 3D printing creators
          </span>
          <h1 className="mt-5 text-5xl font-bold leading-[1.05] text-ink md:text-6xl">
            Turn your 3D print files into <span className="text-primary">monthly income</span>.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-ink-soft">
            Printreon gives 3D creators a simple way to sell STL, 3MF and printable files through monthly memberships — without trying to force Patreon to do something it was never built for.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/auth" search={{ mode: "signup", as: "creator" }} className="btn-primary">
              Start as a Creator <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link to="/explore" className="btn-ghost">Explore Creators</Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-soft">
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Free to start</span>
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> STL, 3MF, OBJ, ZIP</span>
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Cancel anytime</span>
          </div>
        </div>
        <div className="relative">
          <div className="aspect-[4/3] overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-elevated)]">
            <img src={heroImg} alt="3D printer producing a faceted orange model" className="h-full w-full object-cover" width={1600} height={1200} />
          </div>
          <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] md:block">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary"><Wallet className="h-5 w-5" /></div>
              <div>
                <div className="text-xs text-ink-soft">Monthly recurring</div>
                <div className="text-sm font-semibold text-ink">Predictable creator income</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BuiltFor() {
  const items = [
    { icon: Box, title: "Native STL & 3MF", desc: "Upload .stl, .3mf, .obj and .zip — with preview images, tags, and categories made for makers." },
    { icon: Lock, title: "Protected downloads", desc: "Files are never just a public URL. Access is verified by tier, on every download." },
    { icon: Layers, title: "Tiered memberships", desc: "Supporter, Standard, Premium Vault, Commercial Licence — your structure, your prices." },
  ];
  return (
    <section className="container-page py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-ink md:text-4xl">Built for 3D creators, not generic content creators.</h2>
        <p className="mt-3 text-ink-soft">From STL designers to print farms, Printreon is the membership platform that actually understands 3D files.</p>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {items.map((it) => (
          <div key={it.title} className="card-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
              <it.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-ink">{it.title}</h3>
            <p className="mt-2 text-sm text-ink-soft">{it.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", icon: Sparkles, title: "Create your creator page", desc: "Display name, slug, bio, banner and socials." },
    { n: "02", icon: Layers, title: "Add membership tiers", desc: "Use templates or design your own pricing." },
    { n: "03", icon: Upload, title: "Upload your files", desc: "STL, 3MF, OBJ, ZIP with preview images." },
    { n: "04", icon: Share2, title: "Share your page", desc: "Use built-in launch kits to drive subscribers." },
    { n: "05", icon: CreditCard, title: "Get paid monthly", desc: "Members subscribe, you get recurring revenue." },
  ];
  return (
    <section className="bg-surface">
      <div className="container-page py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-ink md:text-4xl">How it works</h2>
          <p className="mt-3 text-ink-soft">Five steps from blank page to paid monthly memberships.</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-5">
          {steps.map((s) => (
            <div key={s.n} className="card-soft">
              <div className="text-xs font-bold tracking-widest text-primary">{s.n}</div>
              <s.icon className="mt-3 h-6 w-6 text-ink" />
              <h3 className="mt-3 text-base font-semibold text-ink">{s.title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyCreators() {
  const cards = [
    { icon: Lock, title: "File protection", desc: "Signed, time-limited downloads tied to active subscriptions." },
    { icon: Layers, title: "Tiered memberships", desc: "Multiple tiers per creator with their own benefits and price." },
    { icon: Box, title: "Subscriber-only files", desc: "Lock files behind any tier, or release them as free lead magnets." },
    { icon: Share2, title: "Free file lead magnets", desc: "Grow your list with free files that require an account." },
    { icon: TrendingUp, title: "Creator analytics", desc: "Revenue, downloads, conversion and follower-to-sub data." },
    { icon: Rocket, title: "Built-in growth tools", desc: "Referral links, launch kits, social share graphics, QR codes." },
  ];
  return (
    <section className="container-page py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-ink md:text-4xl">Why creators use Printreon</h2>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.title} className="card-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
              <c.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-ink">{c.title}</h3>
            <p className="mt-2 text-sm text-ink-soft">{c.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function EverythingIncluded() {
  const groups = [
    {
      title: "Files & content",
      icon: FileBox,
      items: [
        "Native STL, 3MF, OBJ & ZIP uploads",
        "Tier-gated and free-with-account files",
        "Posts with rich media for subscribers",
        "Bundles to package multiple files together",
        "Announcements pinned to your creator page",
      ],
    },
    {
      title: "Memberships & monetisation",
      icon: CreditCard,
      items: [
        "Unlimited tiers with custom price & benefits",
        "Embedded Stripe checkout (no redirect)",
        "Upgrades & downgrades, automatically prorated",
        "Cancel anytime — access until period end",
        "Promo codes and subscriber discount links",
        "Gift subscriptions",
      ],
    },
    {
      title: "Community & engagement",
      icon: Users,
      items: [
        "Comments on posts and files",
        "Direct messages between members & creators",
        "Followers (free) + paid subscribers",
        "Member wishlists & collections",
        "Personal print log for makers",
      ],
    },
    {
      title: "Growth & marketing",
      icon: Rocket,
      items: [
        "Unique referral links per creator",
        "Free file lead magnets",
        "Pre-written launch posts (FB, IG, X, Reddit)",
        "QR codes & embeddable creator badges",
        "Auto-emails to followers on every new drop",
      ],
    },
    {
      title: "Insights & operations",
      icon: BarChart3,
      items: [
        "Revenue, MRR & churn analytics",
        "Download, conversion & follower-to-sub data",
        "Admin moderation tools",
        "Reporting & DMCA workflow",
        "Stripe customer portal for members",
      ],
    },
    {
      title: "Trust & protection",
      icon: ShieldCheck,
      items: [
        "Signed, time-limited download URLs",
        "Access re-checked on every download",
        "Email verification & secure auth",
        "Row-level security on every table",
        "Creator-owned brand and audience",
      ],
    },
  ];
  return (
    <section className="bg-surface">
      <div className="container-page py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-ink md:text-4xl">Everything you get, in the box.</h2>
          <p className="mt-3 text-ink-soft">No plugins, no duct tape. Printreon ships with the full stack a 3D print creator actually needs.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <div key={g.title} className="card-soft">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
                  <g.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-ink">{g.title}</h3>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-ink">
                {g.items.map((i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PaymentsAndPayouts() {
  const cards = [
    { icon: CreditCard, title: "Embedded checkout", desc: "Subscribers pay without ever leaving your creator page. Powered by Stripe." },
    { icon: Banknote, title: "Stripe Connect payouts", desc: "Money lands in your bank, not ours. Standard Stripe payout schedule." },
    { icon: Tag, title: "Promo codes & discounts", desc: "Run launches and member-only deals with full code support." },
    { icon: Gift, title: "Gift subscriptions", desc: "Members can gift a tier to friends — a built-in growth loop." },
    { icon: Package, title: "Bundles", desc: "Sell curated packs of files alongside your monthly tiers." },
    { icon: Wallet, title: "Transparent platform fee", desc: "One small fee per paid sub. No monthly minimums, no upsells." },
  ];
  return (
    <section className="container-page py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-ink md:text-4xl">Payments & payouts, sorted.</h2>
        <p className="mt-3 text-ink-soft">From the first $5 sub to your first $5k month — billing, tax handling and payouts are wired in from day one.</p>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.title} className="card-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
              <c.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-ink">{c.title}</h3>
            <p className="mt-2 text-sm text-ink-soft">{c.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CommunityFeatures() {
  const cards = [
    { icon: MessageSquare, title: "Posts & comments", desc: "Share updates, work-in-progress shots and behind-the-scenes for your subscribers." },
    { icon: Mail, title: "Direct messages", desc: "Private 1:1 chats between you and your members." },
    { icon: Megaphone, title: "Announcements", desc: "Pin important updates to the top of your creator page." },
    { icon: Bell, title: "New-drop emails", desc: "Followers and subscribers get an email the second you publish." },
    { icon: Heart, title: "Wishlist & follows", desc: "Members save the files they want and follow creators for free." },
    { icon: Hammer, title: "Print log", desc: "Makers track what they've printed, in what filament, with what settings." },
  ];
  return (
    <section className="bg-ink/[0.02]">
      <div className="container-page py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-ink md:text-4xl">A community, not just a paywall.</h2>
          <p className="mt-3 text-ink-soft">Build the kind of relationship with makers that turns one-off downloaders into long-term subscribers.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {cards.map((c) => (
            <div key={c.title} className="card-soft">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-ink">{c.title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ForSupporters() {
  return (
    <section className="bg-ink text-background">
      <div className="container-page grid gap-10 py-20 md:grid-cols-2 md:items-center">
        <div>
          <h2 className="text-3xl font-bold md:text-4xl text-background">For supporters who love 3D printing.</h2>
          <p className="mt-4 text-background/70">
            Back the designers behind your favourite prints. Get fresh STL drops every month, exclusive tiers, and follow creators for free until you're ready to subscribe.
          </p>
          <Link to="/explore" className="btn-primary mt-6 inline-flex">Explore creators</Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {["Miniatures", "Cosplay", "Functional", "Toys", "Tools", "Tabletop"].map((t) => (
            <div key={t} className="rounded-xl border border-background/15 bg-background/5 p-4 text-sm font-medium text-background">{t}</div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GrowthTools() {
  const items = [
    "Unique creator referral links",
    "Free file lead magnets",
    "Pre-written launch posts (FB, IG, X, Reddit)",
    "QR codes & embeddable creator badges",
    "Subscriber discount links",
    "Follow-before-subscribe funnel",
  ];
  return (
    <section className="container-page py-20">
      <div className="grid gap-10 md:grid-cols-2 md:items-center">
        <div>
          <h2 className="text-3xl font-bold text-ink md:text-4xl">Growth tools, in the box.</h2>
          <p className="mt-3 text-ink-soft">Stop building your own funnels. Printreon ships with the growth loops creators actually need.</p>
        </div>
        <ul className="grid gap-3">
          {items.map((i) => (
            <li key={i} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
              <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
              <span className="text-sm font-medium text-ink">{i}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section className="bg-surface">
      <div className="container-page py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-ink md:text-4xl">Simple, creator-friendly pricing</h2>
          <p className="mt-3 text-ink-soft">Free to start. No monthly fee. We earn when you do.</p>
        </div>
        <div className="mx-auto mt-10 grid max-w-3xl gap-5 md:grid-cols-2">
          <div className="card-soft">
            <h3 className="text-lg font-semibold text-ink">Creator</h3>
            <div className="mt-4 text-4xl font-bold text-ink">Free<span className="ml-1 text-base font-medium text-ink-soft">to start</span></div>
            <p className="mt-2 text-sm text-ink-soft">Small platform fee on paid subscriptions. Free files are always free to distribute.</p>
            <ul className="mt-5 space-y-2 text-sm text-ink">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Unlimited tiers</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Unlimited STL/3MF uploads</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Built-in growth tools</li>
            </ul>
            <Link to="/auth" search={{ mode: "signup", as: "creator" }} className="btn-primary mt-6 w-full">Start as a Creator</Link>
          </div>
          <div className="card-soft">
            <h3 className="text-lg font-semibold text-ink">Member</h3>
            <div className="mt-4 text-4xl font-bold text-ink">$0<span className="ml-1 text-base font-medium text-ink-soft">/month</span></div>
            <p className="mt-2 text-sm text-ink-soft">Free account. Pay only when you subscribe to a creator's tier.</p>
            <ul className="mt-5 space-y-2 text-sm text-ink">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Follow creators for free</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Download free files</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Cancel any subscription anytime</li>
            </ul>
            <Link to="/auth" search={{ mode: "signup" }} className="btn-ghost mt-6 w-full">Create free account</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const qs = [
    ["Can I upload STL files?", "Yes. STL is a first-class file type along with 3MF, OBJ and ZIP archives."],
    ["Can I offer free files?", "Yes — mark any file free with account. It's the best lead magnet for new subscribers."],
    ["Can I create multiple tiers?", "Absolutely. Build Supporter, Standard, Premium Vault and Commercial Licence tiers."],
    ["Can I use it instead of Patreon?", "That's exactly what it's for. Patreon was never built for STL files. Printreon is."],
    ["How do payouts work?", "Subscriptions are processed by Stripe. Payouts route through our connected-account system."],
    ["Can subscribers cancel anytime?", "Yes. Members manage everything through the secure Stripe customer portal."],
  ];
  return (
    <section className="container-page py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-ink md:text-4xl">Questions, answered</h2>
      </div>
      <div className="mx-auto mt-10 grid max-w-3xl gap-3">
        {qs.map(([q, a]) => (
          <details key={q} className="group rounded-xl border border-border bg-card p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between text-base font-semibold text-ink">
              {q}
              <span className="ml-4 text-primary transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm text-ink-soft">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="container-page py-20">
      <div className="rounded-3xl bg-ink p-10 text-center md:p-16">
        <h2 className="text-3xl font-bold text-background md:text-5xl">Start your Printreon page today.</h2>
        <p className="mx-auto mt-4 max-w-xl text-background/70">Free to set up. Built for STL creators. Ready when your first subscriber arrives.</p>
        <Link to="/auth" search={{ mode: "signup", as: "creator" }} className="btn-primary mt-8 inline-flex">
          Become a Creator <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
