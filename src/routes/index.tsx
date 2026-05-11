import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { WaitlistForm } from "@/components/WaitlistForm";
import { SITE_URL, PARTNER } from "@/lib/site";
import heroImg from "@/assets/hero.jpg";
import {
  Layers, Lock, Sparkles, Share2, Wallet,
  Upload, CreditCard, Rocket, Check, Box,
  Mail, MessageSquare, Heart, Tag, Gift, Package, BarChart3,
  Bell, Banknote, ShieldCheck, Users, FileBox, Hammer, Megaphone,
  ArrowUpRight, Zap,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Printreon — Memberships built for 3D print creators. Launching soon." },
      { name: "description", content: "Printreon is the Patreon alternative purpose-built for STL, 3MF and printable files. Join the waitlist for early creator access." },
      { property: "og:title", content: "Printreon — Memberships for 3D print creators" },
      { property: "og:description", content: "STL-native memberships, file protection, growth tools. Join the waitlist." },
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
      <Marquee />
      <BuiltFor />
      <PullQuote />
      <HowItWorks />
      <ProductPeek />
      <EverythingBento />
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

/* ------------------------------- HERO ------------------------------- */

function Hero() {
  return (
    <section className="facet-bg relative overflow-hidden">
      {/* Blueprint grid background */}
      <div className="pointer-events-none absolute inset-0 blueprint-grid opacity-60" aria-hidden />
      {/* Faint gcode-like SVG paths */}
      <svg
        aria-hidden
        className="pointer-events-none absolute -right-20 top-10 h-[520px] w-[520px] text-primary/20"
        viewBox="0 0 400 400"
        fill="none"
      >
        {Array.from({ length: 18 }).map((_, i) => (
          <circle key={i} cx="200" cy="200" r={20 + i * 9} stroke="currentColor" strokeWidth="0.6" strokeDasharray="3 6" />
        ))}
      </svg>

      <div className="container-wide grid gap-14 py-16 md:grid-cols-12 md:items-center md:py-24">
        {/* LEFT: editorial copy + waitlist */}
        <div className="md:col-span-7 reveal">
          <span className="eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            v1.0 — Opening to creators soon
          </span>

          <h1 className="mt-6 text-[44px] leading-[0.98] text-ink md:text-[88px] md:leading-[0.92]">
            <span className="font-display italic text-primary">Printr</span>
            <span className="font-display italic">eon turns your</span>
            <br />
            <span className="font-bold">3D files into</span>{" "}
            <span className="relative inline-block">
              <span className="font-bold">monthly income.</span>
              <svg viewBox="0 0 300 14" className="absolute -bottom-2 left-0 h-3 w-full text-primary" preserveAspectRatio="none">
                <path d="M2 8 Q 75 2, 150 8 T 298 8" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-lg text-ink-soft">
            The Patreon alternative built for STL, 3MF and printable files —
            with native uploads, tiered memberships, file protection and growth tools
            wired in from day one.
          </p>

          <div id="waitlist" className="mt-8 scroll-mt-24">
            <WaitlistForm />
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-ink-soft">
            <SocialProof />
            <span className="hidden h-4 w-px bg-border md:inline-block" />
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Free to join</span>
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Early creator perks</span>
          </div>
        </div>

        {/* RIGHT: stacked product mock + ornaments */}
        <div className="relative md:col-span-5">
          <div className="relative">
            {/* Background layered card — mock dashboard */}
            <div className="absolute -left-6 -top-6 hidden w-[88%] rotate-[-3deg] rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] md:block">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <div className="h-2 w-2 rounded-full bg-destructive/70" />
                <div className="h-2 w-2 rounded-full bg-primary/70" />
                <div className="h-2 w-2 rounded-full bg-electric" />
                <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-ink-soft">creator/files</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="aspect-square rounded-md border border-border bg-surface" />
                ))}
              </div>
            </div>

            {/* Foreground hero image */}
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-elevated)]">
              <img
                src={heroImg}
                alt="3D printer producing a faceted orange model"
                className="h-full w-full object-cover"
                width={1600}
                height={2000}
              />
              {/* Layer-line texture on image */}
              <div className="pointer-events-none absolute inset-0 layer-lines mix-blend-multiply" aria-hidden />

              {/* Top stat strip */}
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/40 bg-white/85 px-3 py-1.5 backdrop-blur">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink">Live preview</span>
              </div>

              {/* Bottom file card overlay */}
              <div className="absolute inset-x-4 bottom-4 rounded-xl border border-white/40 bg-white/95 p-3 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">dragon_v3.stl</div>
                    <div className="mt-0.5 text-sm font-semibold text-ink">Premium Vault tier</div>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
                    GATED
                  </span>
                </div>
              </div>
            </div>

            {/* Spinning ornament */}
            <div className="absolute -bottom-10 -right-8 hidden h-40 w-40 md:block">
              <svg viewBox="0 0 100 100" className="spin-slow h-full w-full text-ink/70">
                <defs>
                  <path id="circle" d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
                </defs>
                <text fontSize="7.5" fill="currentColor" letterSpacing="3" className="font-mono">
                  <textPath href="#circle">PRINTREON · MEMBERSHIPS FOR MAKERS · PRINTREON · MEMBERSHIPS FOR MAKERS · </textPath>
                </text>
              </svg>
            </div>

            {/* Floating "monthly recurring" pill */}
            <div className="absolute -bottom-6 -left-4 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-electric/40 text-ink">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">Monthly recurring</div>
                  <div className="text-sm font-semibold text-ink">$1,247 <span className="text-ink-soft">·</span> 84 subs</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="edge-divider mx-6" />
    </section>
  );
}

function SocialProof() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        {["#ea7a2c","#1f1f1f","#a3e635","#525252","#ea7a2c"].map((c,i) => (
          <div key={i} className="h-7 w-7 rounded-full border-2 border-background" style={{ background: c }} />
        ))}
      </div>
      <span className="text-sm text-ink"><b className="font-semibold">300+ creators</b> already on the list</span>
    </div>
  );
}

/* ------------------------------ MARQUEE ------------------------------ */

function Marquee() {
  const items = ["STL", "3MF", "OBJ", "ZIP", "TIERED MEMBERSHIPS", "STRIPE PAYOUTS", "FILE PROTECTION", "REFERRALS", "BUNDLES", "PROMO CODES", "GIFT SUBS", "ANALYTICS"];
  return (
    <section className="border-y border-border bg-ink py-4 text-background overflow-hidden">
      <div className="flex gap-12 marquee-track whitespace-nowrap font-mono text-xs uppercase tracking-[0.18em] text-background/70">
        {[...items, ...items, ...items].map((t, i) => (
          <span key={i} className="flex items-center gap-12">
            <span>{t}</span>
            <span className="text-primary">●</span>
          </span>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------ BUILT FOR ------------------------------ */

function BuiltFor() {
  const items = [
    { icon: Box, title: "Native STL & 3MF", desc: "Upload .stl, .3mf, .obj and .zip — with previews, tags and categories made for makers.", tag: "01" },
    { icon: Lock, title: "Protected downloads", desc: "Files are never just a public URL. Access is verified by tier, on every download.", tag: "02" },
    { icon: Layers, title: "Tiered memberships", desc: "Supporter, Standard, Premium Vault, Commercial Licence — your structure, your prices.", tag: "03" },
  ];
  return (
    <section className="container-wide py-24">
      <div className="grid gap-10 md:grid-cols-12 md:items-end">
        <div className="md:col-span-5">
          <span className="eyebrow">// Built for 3D creators</span>
          <h2 className="mt-5 text-4xl text-ink md:text-6xl">
            <span className="font-display italic">Made for</span>{" "}
            <span className="font-bold">makers,</span>{" "}
            <span className="font-display italic">not generic</span>{" "}
            <span className="font-bold">content creators.</span>
          </h2>
        </div>
        <p className="md:col-span-6 md:col-start-7 text-lg text-ink-soft">
          From STL designers to print farms, every primitive on Printreon
          is shaped around 3D files — not videos, not blog posts, not podcasts.
        </p>
      </div>

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {items.map((it) => (
          <div key={it.title} className="card-soft group relative overflow-hidden">
            <div className="absolute right-5 top-5 font-mono text-xs text-ink-soft/60">{it.tag}</div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary">
              <it.icon className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-2xl font-display italic text-ink">{it.title}</h3>
            <p className="mt-3 text-sm text-ink-soft">{it.desc}</p>
            <div className="mt-6 h-px w-full bg-border group-hover:bg-primary transition-colors" />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------ PULL QUOTE ------------------------------ */

function PullQuote() {
  return (
    <section className="bg-ink text-background grain-overlay relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 blueprint-grid-dark opacity-50" aria-hidden />
      <div className="container-page relative py-24 md:py-32">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Manifesto · 001</div>
        <blockquote className="mt-6 max-w-4xl font-display text-5xl leading-[1.05] md:text-7xl md:leading-[1.02]">
          <span className="text-primary italic">"Patreon</span>
          <span className="italic"> was never built </span>
          <br className="hidden md:block" />
          <span className="italic">for </span>
          <span className="font-bold not-italic">STL files.</span>
          <br className="hidden md:block" />
          <span className="italic"> Printreon </span>
          <span className="font-bold not-italic underline decoration-primary decoration-4 underline-offset-8">is.</span>
          <span className="text-primary">”</span>
        </blockquote>
        <p className="mt-8 max-w-xl text-background/70">
          We built the platform we wished existed when we tried to sell our first STL —
          file gating that actually works, payouts that don't take 60 days, and a UI
          that understands the difference between a 3MF and a JPEG.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------ HOW IT WORKS ------------------------------ */

function HowItWorks() {
  const steps = [
    { n: "01", icon: Sparkles, title: "Create your page", desc: "Display name, slug, bio, banner, socials — live in minutes." },
    { n: "02", icon: Layers, title: "Build your tiers", desc: "Use templates or design pricing from scratch." },
    { n: "03", icon: Upload, title: "Upload files", desc: "STL, 3MF, OBJ, ZIP with rich preview images." },
    { n: "04", icon: Share2, title: "Share & launch", desc: "Built-in launch kits drop subscribers in your lap." },
    { n: "05", icon: CreditCard, title: "Get paid monthly", desc: "Stripe Connect handles the boring stuff." },
  ];
  return (
    <section className="bg-surface relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 layer-lines opacity-70" aria-hidden />
      <div className="container-wide relative py-24">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="eyebrow">// Workflow</span>
            <h2 className="mt-5 text-4xl text-ink md:text-6xl">
              <span className="font-display italic">Five steps</span>{" "}
              <span className="font-bold">from blank page to paid.</span>
            </h2>
          </div>
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
            avg. setup time · 22 min
          </div>
        </div>

        <div className="relative mt-14">
          {/* Connector line */}
          <div className="pointer-events-none absolute left-0 right-0 top-8 hidden h-px bg-border md:block" />
          <div className="grid gap-5 md:grid-cols-5">
            {steps.map((s) => (
              <div key={s.n} className="relative card-soft">
                <div className="absolute -top-3 left-6 rounded-full bg-primary px-2.5 py-1 font-mono text-[10px] font-bold text-primary-foreground">
                  STEP {s.n}
                </div>
                <s.icon className="mt-3 h-7 w-7 text-ink" />
                <h3 className="mt-4 text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ PRODUCT PEEK ------------------------------ */

function ProductPeek() {
  return (
    <section className="container-wide py-24">
      <div className="grid gap-12 md:grid-cols-12 md:items-center">
        <div className="md:col-span-5">
          <span className="eyebrow">// Inside the dashboard</span>
          <h2 className="mt-5 text-4xl text-ink md:text-5xl">
            <span className="font-display italic">A creator tool that</span>{" "}
            <span className="font-bold">actually understands files.</span>
          </h2>
          <p className="mt-5 text-lg text-ink-soft">
            Drag and drop an STL, set the tier, write the post, hit publish.
            That's it. No Zapier, no S3 buckets, no "how do I gate this" forum threads.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Per-file tier gating with one click",
              "Preview images auto-arranged in a gallery",
              "Bundles, free files, and subscriber-only posts",
              "Real-time MRR, churn and download analytics",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-sm text-ink">
                <Check className="mt-0.5 h-4 w-4 text-primary" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Dashboard mock */}
        <div className="md:col-span-7">
          <div className="relative rounded-3xl border border-border bg-ink p-3 shadow-[var(--shadow-elevated)]">
            <div className="rounded-2xl bg-background p-5">
              {/* Top bar */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-primary/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-electric" />
                  <span className="ml-3 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
                    printreon.com / dashboard / files
                  </span>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary">PUBLISHED</span>
              </div>

              {/* Stat row */}
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { k: "MRR", v: "$1,247", d: "+12%" },
                  { k: "Subs", v: "84", d: "+6" },
                  { k: "Files", v: "37", d: "+3" },
                ].map((s) => (
                  <div key={s.k} className="rounded-xl border border-border bg-surface p-3">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">{s.k}</div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-xl font-bold text-ink">{s.v}</span>
                      <span className="text-[10px] font-semibold text-primary">{s.d}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* File list */}
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { n: "dragon_v3.stl", t: "Premium" },
                  { n: "lowpoly_helmet.3mf", t: "Standard" },
                  { n: "articulated_octopus.zip", t: "Free" },
                  { n: "tabletop_set.zip", t: "Standard" },
                  { n: "voxel_planter.stl", t: "Premium" },
                  { n: "phone_dock.3mf", t: "Free" },
                ].map((f, i) => (
                  <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="aspect-[4/3] bg-gradient-to-br from-accent via-card to-surface relative">
                      <div className="absolute inset-0 layer-lines opacity-60" />
                      <div className="absolute inset-0 grid place-items-center">
                        <Box className="h-8 w-8 text-primary/60" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="truncate font-mono text-[10px] uppercase tracking-wider text-ink-soft">{f.n}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        f.t === "Free" ? "bg-electric/40 text-ink" :
                        f.t === "Premium" ? "bg-primary text-primary-foreground" :
                        "bg-secondary text-ink"
                      }`}>{f.t}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ EVERYTHING BENTO ------------------------------ */

function EverythingBento() {
  return (
    <section className="bg-ink text-background relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 blueprint-grid-dark opacity-40" aria-hidden />
      <div className="container-wide relative py-24">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <span className="eyebrow-dark">// Everything in the box</span>
            <h2 className="mt-5 text-4xl text-background md:text-6xl">
              <span className="font-display italic">No plugins.</span>{" "}
              <span className="font-bold">No duct tape.</span>
            </h2>
          </div>
          <p className="md:col-span-5 text-background/70">
            Printreon ships with the full stack a 3D print creator actually
            needs — files, payments, community and growth, all in one place.
          </p>
        </div>

        <div className="mt-14 grid auto-rows-[160px] grid-cols-2 gap-4 md:grid-cols-4">
          {/* Big tile: files */}
          <BentoCard span="md:col-span-2 md:row-span-2" icon={FileBox} title="Files & content">
            <ul className="mt-3 space-y-1.5 text-sm text-background/80">
              {["Native STL, 3MF, OBJ & ZIP","Tier-gated + free files","Posts with rich media","Bundles & announcements"].map(i => (
                <li key={i} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-primary"/>{i}</li>
              ))}
            </ul>
          </BentoCard>

          <BentoCard icon={CreditCard} title="Memberships" accent="primary">
            <p className="mt-2 text-sm text-background/70">Unlimited tiers, embedded checkout, prorated upgrades.</p>
          </BentoCard>

          <BentoCard icon={Banknote} title="Stripe payouts">
            <p className="mt-2 text-sm text-background/70">Money lands in your bank, not ours.</p>
          </BentoCard>

          <BentoCard icon={Users} title="Community">
            <p className="mt-2 text-sm text-background/70">Posts, comments, DMs, followers + paid subs.</p>
          </BentoCard>

          <BentoCard icon={Rocket} title="Growth tools" accent="electric">
            <p className="mt-2 text-sm text-background/70">Referrals, lead magnets, launch kits.</p>
          </BentoCard>

          <BentoCard span="md:col-span-2" icon={BarChart3} title="Analytics & ops">
            <p className="mt-2 text-sm text-background/70">MRR, churn, conversion, downloads — and admin moderation built in.</p>
          </BentoCard>

          <BentoCard span="md:col-span-2" icon={ShieldCheck} title="Trust & protection">
            <p className="mt-2 text-sm text-background/70">Signed time-limited URLs, RLS on every table, access checked on every download.</p>
          </BentoCard>
        </div>
      </div>
    </section>
  );
}

function BentoCard({
  icon: Icon, title, children, span = "", accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children?: React.ReactNode;
  span?: string;
  accent?: "primary" | "electric";
}) {
  const accentBg = accent === "primary" ? "bg-primary text-primary-foreground" :
                   accent === "electric" ? "bg-electric text-electric-foreground" :
                   "bg-white/10 text-background";
  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all hover:bg-white/[0.06] ${span}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accentBg}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-xl font-display italic text-background">{title}</h3>
      {children}
      <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-background/30 transition-all group-hover:text-background group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </div>
  );
}

/* ------------------------------ PAYMENTS ------------------------------ */

function PaymentsAndPayouts() {
  const cards = [
    { icon: CreditCard, title: "Embedded checkout", desc: "Subscribers pay without ever leaving your creator page." },
    { icon: Banknote, title: "Stripe Connect", desc: "Money lands in your bank, on Stripe's payout schedule." },
    { icon: Tag, title: "Promo codes", desc: "Run launches and member-only deals with full code support." },
    { icon: Gift, title: "Gift subscriptions", desc: "Members can gift a tier — a built-in growth loop." },
    { icon: Package, title: "Bundles", desc: "Sell curated packs of files alongside your monthly tiers." },
    { icon: Wallet, title: "Transparent fee", desc: "One small fee per paid sub. No monthly minimums." },
  ];
  return (
    <section className="container-wide py-24">
      <div className="grid gap-10 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <span className="eyebrow">// Payments & payouts</span>
          <h2 className="mt-5 text-4xl text-ink md:text-6xl">
            <span className="font-display italic">From your first $5</span>
            <br />
            <span className="font-bold">to your first $5K month.</span>
          </h2>
        </div>
        <p className="md:col-span-5 text-lg text-ink-soft">
          Billing, tax handling and payouts are wired in from day one — powered by Stripe.
        </p>
      </div>
      <div className="mt-14 grid gap-5 md:grid-cols-3">
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

/* ------------------------------ COMMUNITY ------------------------------ */

function CommunityFeatures() {
  const cards = [
    { icon: MessageSquare, title: "Posts & comments", desc: "Updates, work-in-progress shots, behind-the-scenes." },
    { icon: Mail, title: "Direct messages", desc: "Private 1:1 chats between you and your members." },
    { icon: Megaphone, title: "Announcements", desc: "Pin important updates to your creator page." },
    { icon: Bell, title: "New-drop emails", desc: "Followers get an email the second you publish." },
    { icon: Heart, title: "Wishlist & follows", desc: "Members save files and follow creators for free." },
    { icon: Hammer, title: "Print log", desc: "Makers track prints, filament, and settings." },
  ];
  return (
    <section className="bg-surface relative overflow-hidden">
      <div className="container-wide relative py-24">
        <div className="grid gap-10 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <span className="eyebrow">// Community</span>
            <h2 className="mt-5 text-4xl text-ink md:text-6xl">
              <span className="font-display italic">A community,</span>{" "}
              <span className="font-bold">not just a paywall.</span>
            </h2>
          </div>
          <p className="md:col-span-5 text-lg text-ink-soft">
            Build the relationship that turns one-off downloaders into long-term subscribers.
          </p>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
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

/* ------------------------------ FOR SUPPORTERS ------------------------------ */

function ForSupporters() {
  return (
    <section className="bg-ink text-background relative overflow-hidden grain-overlay">
      <div className="pointer-events-none absolute inset-0 blueprint-grid-dark opacity-30" aria-hidden />
      <div className="container-wide relative grid gap-12 py-24 md:grid-cols-12 md:items-center">
        <div className="md:col-span-6">
          <span className="eyebrow-dark">// For supporters</span>
          <h2 className="mt-5 text-4xl md:text-6xl text-background">
            <span className="font-display italic">For the people</span>{" "}
            <span className="font-bold">who love 3D printing.</span>
          </h2>
          <p className="mt-6 max-w-lg text-background/70 text-lg">
            Back the designers behind your favourite prints. Get fresh STL drops every month,
            exclusive tiers, and follow creators for free until you're ready to subscribe.
          </p>
          <a href="#waitlist" className="btn-electric mt-8 inline-flex">
            Join as a supporter
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </a>
        </div>
        <div className="md:col-span-6 grid grid-cols-3 gap-3">
          {["Miniatures", "Cosplay", "Functional", "Toys", "Tools", "Tabletop", "Terrain", "Articulated", "Decor"].map((t, i) => (
            <div
              key={t}
              className={`rounded-2xl border p-5 text-sm font-display italic ${
                i % 4 === 0 ? "border-primary/40 bg-primary/10 text-background" :
                i % 4 === 1 ? "border-white/15 bg-white/[0.03] text-background" :
                i % 4 === 2 ? "border-electric/30 bg-electric/10 text-background" :
                "border-white/10 bg-white/[0.02] text-background/80"
              }`}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ GROWTH TOOLS ------------------------------ */

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
    <section className="container-wide py-24">
      <div className="grid gap-12 md:grid-cols-12 md:items-center">
        <div className="md:col-span-5">
          <span className="eyebrow">// Growth tools</span>
          <h2 className="mt-5 text-4xl text-ink md:text-6xl">
            <span className="font-display italic">Stop building</span>{" "}
            <span className="font-bold">your own funnels.</span>
          </h2>
          <p className="mt-5 text-lg text-ink-soft">
            Printreon ships with the growth loops creators actually need —
            so you spend your time designing, not duct-taping marketing tools together.
          </p>
        </div>
        <ul className="md:col-span-7 grid gap-3 sm:grid-cols-2">
          {items.map((i, idx) => (
            <li key={i} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
              <span className="mt-0.5 font-mono text-xs text-ink-soft">{String(idx+1).padStart(2,"0")}</span>
              <span className="text-sm font-medium text-ink">{i}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------ PRICING ------------------------------ */

function Pricing() {
  return (
    <section className="bg-surface relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 layer-lines opacity-50" aria-hidden />
      <div className="container-wide relative py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">// Pricing</span>
          <h2 className="mt-5 text-4xl text-ink md:text-6xl">
            <span className="font-display italic">Simple,</span>{" "}
            <span className="font-bold">creator-friendly.</span>
          </h2>
          <p className="mt-4 text-ink-soft">Free to start. No monthly fee. We earn when you do.</p>
        </div>
        <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
          <div className="card-soft relative overflow-hidden">
            <span className="absolute right-4 top-4 rounded-full bg-primary px-2.5 py-1 font-mono text-[10px] font-bold text-primary-foreground">
              CREATOR
            </span>
            <h3 className="text-lg font-semibold text-ink">For creators</h3>
            <div className="mt-4 font-display text-6xl text-ink">Free<span className="ml-1 align-middle font-sans text-base font-medium text-ink-soft">to start</span></div>
            <p className="mt-2 text-sm text-ink-soft">Small platform fee on paid subs. Free files always free to distribute.</p>
            <ul className="mt-5 space-y-2 text-sm text-ink">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Unlimited tiers</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Unlimited STL/3MF uploads</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Built-in growth tools</li>
            </ul>
            <a href="#waitlist" className="btn-primary mt-7 w-full text-center">Join as a creator</a>
          </div>
          <div className="card-soft relative overflow-hidden">
            <span className="absolute right-4 top-4 rounded-full bg-electric px-2.5 py-1 font-mono text-[10px] font-bold text-electric-foreground">
              MEMBER
            </span>
            <h3 className="text-lg font-semibold text-ink">For members</h3>
            <div className="mt-4 font-display text-6xl text-ink">$0<span className="ml-1 align-middle font-sans text-base font-medium text-ink-soft">/month</span></div>
            <p className="mt-2 text-sm text-ink-soft">Free account. Pay only when you subscribe to a creator's tier.</p>
            <ul className="mt-5 space-y-2 text-sm text-ink">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Follow creators for free</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Download free files</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Cancel any subscription anytime</li>
            </ul>
            <a href="#waitlist" className="btn-ghost mt-7 w-full text-center">Join as a supporter</a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ FAQ ------------------------------ */

function FAQ() {
  const qs = [
    ["Can I upload STL files?", "Yes. STL is a first-class file type along with 3MF, OBJ and ZIP archives."],
    ["Can I offer free files?", "Yes — mark any file free with account. The best lead magnet for new subscribers."],
    ["Can I create multiple tiers?", "Absolutely. Build Supporter, Standard, Premium Vault and Commercial Licence tiers."],
    ["Can I use it instead of Patreon?", "That's exactly what it's for. Patreon was never built for STL files. Printreon is."],
    ["How do payouts work?", "Subscriptions process through Stripe. Payouts route via our connected-account system."],
    ["Can subscribers cancel anytime?", "Yes. Members manage everything through the secure Stripe customer portal."],
  ];
  return (
    <section className="container-wide py-24">
      <div className="grid gap-10 md:grid-cols-12 md:items-start">
        <div className="md:col-span-4">
          <span className="eyebrow">// FAQ</span>
          <h2 className="mt-5 text-4xl text-ink md:text-5xl">
            <span className="font-display italic">Questions,</span>
            <br />
            <span className="font-bold">answered.</span>
          </h2>
          <p className="mt-5 text-ink-soft">
            Can't find what you're looking for?{" "}
            <a href="#waitlist" className="font-semibold text-primary underline underline-offset-4">
              Drop your email
            </a>{" "}
            and we'll answer it personally.
          </p>
        </div>
        <div className="md:col-span-8 grid gap-3">
          {qs.map(([q, a]) => (
            <details key={q} className="group rounded-xl border border-border bg-card p-5 open:bg-surface">
              <summary className="flex cursor-pointer list-none items-center justify-between text-base font-semibold text-ink">
                {q}
                <span className="ml-4 font-mono text-primary transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ FINAL CTA ------------------------------ */

function FinalCTA() {
  return (
    <section className="container-wide py-16 md:py-24">
      <div className="relative overflow-hidden rounded-3xl bg-ink p-10 text-center md:p-20 grain-overlay">
        <div className="pointer-events-none absolute inset-0 blueprint-grid-dark opacity-50" aria-hidden />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/30 blur-3xl" aria-hidden />

        <div className="relative">
          <span className="eyebrow-dark">// Pre-launch · waitlist open</span>
          <h2 className="mx-auto mt-6 max-w-3xl text-5xl text-background md:text-7xl">
            <span className="font-display italic">Be first in line</span>{" "}
            <br className="hidden md:block" />
            <span className="font-bold">when Printreon opens.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-background/70">
            Built for STL creators and the people who love their work.
            Partnered with{" "}
            <a href={PARTNER.url} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">
              {PARTNER.name}
            </a>.
          </p>
          <div className="mt-10 flex justify-center">
            <WaitlistForm variant="dark" />
          </div>
        </div>
      </div>
    </section>
  );
}
