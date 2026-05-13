import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { supabase } from "@/integrations/supabase/client";
import { SITE_URL } from "@/lib/site";
import { Check, Copy, Crown, Rocket, Share2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/waitlist")({
  head: () => ({
    meta: [
      { title: "You're on the Printreon waitlist" },
      { name: "description", content: "Your founding-creator application is in. Track your referral progress and wave placement." },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/waitlist` }],
  }),
  component: WaitlistPage,
});

type App = {
  email?: string;
  referral_code?: string;
  status?: string;
  founder_pricing_eligible?: boolean;
  returning?: boolean;
};

function WaitlistPage() {
  const [app, setApp] = useState<App | null>(null);
  const [stats, setStats] = useState<{ referral_count: number; status: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("printreon_application");
      if (raw) setApp(JSON.parse(raw));
    } catch { /* no-op */ }
  }, []);

  useEffect(() => {
    if (!app?.referral_code) return;
    (async () => {
      const { data } = await supabase.rpc("get_beta_referral_stats", { _code: app.referral_code as string });
      const row = Array.isArray(data) ? data[0] : data;
      if (row) setStats({ referral_count: row.referral_count, status: row.status });
    })();
  }, [app?.referral_code]);

  const referralLink = app?.referral_code
    ? `${typeof window !== "undefined" ? window.location.origin : SITE_URL}/?ref=${app.referral_code}`
    : null;

  function copy() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const referrals = stats?.referral_count ?? 0;
  const milestones = [1, 3, 5, 10];
  const nextMilestone = milestones.find((m) => referrals < m) ?? milestones[milestones.length - 1];
  const progress = Math.min(100, (referrals / nextMilestone) * 100);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container-wide py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-2 text-primary">
            <Crown className="h-5 w-5" />
            <span className="font-mono text-xs uppercase tracking-[0.2em]">Founder pricing reserved</span>
          </div>
          <h1 className="mt-4 text-4xl text-ink md:text-6xl">
            <span className="font-display italic">You're officially</span>{" "}
            <span className="font-bold">on the waitlist.</span>
          </h1>
          <p className="mt-5 text-lg text-ink-soft">
            {app?.returning
              ? "We already have your application — your founder pricing is held."
              : "Application received. Wave 1 creator invites begin soon."}
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <Stat icon={Check} label="Application" value="Received" />
            <Stat icon={Crown} label="Founder pricing" value="Reserved" />
            <Stat icon={Rocket} label="Status" value={(stats?.status ?? app?.status ?? "pending").toString()} />
          </div>

          {referralLink ? (
            <div className="mt-10 rounded-3xl border border-border bg-card p-6 md:p-8">
              <div className="flex items-center gap-2 text-primary">
                <Share2 className="h-5 w-5" />
                <span className="font-mono text-xs uppercase tracking-[0.2em]">Move up the waitlist</span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-ink md:text-3xl">
                Invite other creators to skip ahead
              </h2>
              <p className="mt-2 text-sm text-ink-soft">
                Each creator who joins via your link counts toward priority access and earlier
                invite waves.
              </p>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <input
                  readOnly
                  value={referralLink}
                  className="h-12 flex-1 rounded-xl border border-border bg-surface px-4 font-mono text-sm text-ink"
                />
                <button onClick={copy} className="btn-primary h-12 px-5">
                  {copied ? <><Check className="h-4 w-4" /> Copied</> : <><Copy className="h-4 w-4" /> Copy link</>}
                </button>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-soft">
                    {referrals} of {nextMilestone} referrals
                  </span>
                  <span className="font-mono text-xs uppercase tracking-wider text-ink-soft">
                    Next wave perk at {nextMilestone}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-10 rounded-3xl border border-border bg-card p-6 text-sm text-ink-soft">
              We can't find a referral code in this browser session. If you applied on another
              device, sign in once invites open and we'll restore your code.
            </div>
          )}

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <RoadmapCard
              title="Wave 1 — Founding creators"
              desc="First STL creators onboarded. Founder pricing locked in."
              status="next"
            />
            <RoadmapCard
              title="Wave 2 — Expanded beta"
              desc="More creators invited. Storefronts and bundles open up."
              status="upcoming"
            />
            <RoadmapCard
              title="Public launch"
              desc="Open registration. Standard pricing applies — founders keep their rate."
              status="upcoming"
            />
            <RoadmapCard
              title="Sneak peeks"
              desc="Early product previews emailed to applicants only."
              status="rolling"
            />
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link to="/" className="btn-ghost h-11 px-5">Back to site</Link>
            <a
              href={`mailto:?subject=${encodeURIComponent("Try Printreon — invite-only beta for 3D creators")}&body=${encodeURIComponent(`Thought you'd want in on this: ${referralLink ?? SITE_URL}`)}`}
              className="btn-primary h-11 px-5"
            >
              <Sparkles className="h-4 w-4" /> Share via email
            </a>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="card-soft">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 font-mono text-[10px] uppercase tracking-wider text-ink-soft">{label}</div>
      <div className="mt-1 text-lg font-semibold capitalize text-ink">{value}</div>
    </div>
  );
}

function RoadmapCard({ title, desc, status }: { title: string; desc: string; status: "next" | "upcoming" | "rolling" }) {
  const badge =
    status === "next" ? "bg-primary text-primary-foreground" :
    status === "rolling" ? "bg-electric text-electric-foreground" :
    "bg-secondary text-ink";
  const label = status === "next" ? "NEXT" : status === "rolling" ? "ROLLING" : "UPCOMING";
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <span className={`inline-block rounded-full px-2.5 py-1 font-mono text-[10px] font-bold ${badge}`}>{label}</span>
      <h3 className="mt-3 text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-ink-soft">{desc}</p>
    </div>
  );
}
