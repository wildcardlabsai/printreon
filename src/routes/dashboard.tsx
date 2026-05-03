import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteChrome";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Layers, Megaphone, Share2, Plus, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Creator dashboard — MakerMind Club" }] }),
  component: CreatorDashboard,
});

function CreatorDashboard() {
  const { user, loading, isCreator } = useAuth();
  const navigate = useNavigate();
  const [creator, setCreator] = useState<any>(null);
  const [stats, setStats] = useState({ subs: 0, files: 0, downloads: 0, mrr: 0 });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
    if (!loading && user && !isCreator) navigate({ to: "/onboarding/creator" });
  }, [user, loading, isCreator, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: cp } = await supabase.from("creator_profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (!cp) return;
      setCreator(cp);
      const [{ count: filesCount }, { data: subsRows }, { count: dlCount }] = await Promise.all([
        supabase.from("creator_files").select("*", { count: "exact", head: true }).eq("creator_id", cp.id),
        supabase.from("subscriptions").select("tier_id, status, creator_tiers(price)").eq("creator_id", cp.id).eq("status", "active"),
        supabase.from("downloads").select("*", { count: "exact", head: true }).eq("creator_id", cp.id),
      ]);
      const mrr = (subsRows ?? []).reduce((sum: number, r: any) => sum + Number(r.creator_tiers?.price ?? 0), 0);
      setStats({
        subs: subsRows?.length ?? 0,
        files: filesCount ?? 0,
        downloads: dlCount ?? 0,
        mrr,
      });
    })();
  }, [user]);

  if (!creator) return <div className="min-h-screen bg-surface"><SiteHeader /></div>;

  const completion = (() => {
    let score = 0;
    if (creator.display_name) score += 20;
    if (creator.bio) score += 20;
    if (creator.profile_image_url) score += 20;
    if (creator.banner_image_url) score += 15;
    if (creator.is_published) score += 25;
    return score;
  })();

  return (
    <div className="min-h-screen bg-surface">
      <SiteHeader />
      <div className="container-page py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">Creator dashboard</p>
            <h1 className="mt-1 text-3xl font-bold text-ink">Hi {creator.display_name}</h1>
          </div>
          <div className="flex gap-2">
            <Link to="/c/$slug" params={{ slug: creator.slug }} className="btn-ghost"><ExternalLink className="mr-2 h-4 w-4" />View public page</Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <Stat label="Monthly recurring" value={`$${stats.mrr.toFixed(2)}`} />
          <Stat label="Active subscribers" value={stats.subs} />
          <Stat label="Files" value={stats.files} />
          <Stat label="Downloads" value={stats.downloads} />
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <div className="card-soft lg:col-span-2">
            <h2 className="text-lg font-bold text-ink">Next best action</h2>
            <p className="mt-1 text-sm text-ink-soft">Profile completion: {completion}%</p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-primary transition-all" style={{ width: `${completion}%` }} />
            </div>
            <ul className="mt-5 space-y-2 text-sm">
              {!creator.profile_image_url && <ActionRow text="Add a profile image" />}
              {!creator.banner_image_url && <ActionRow text="Add a banner image" />}
              {!creator.bio && <ActionRow text="Write your bio" />}
              {stats.files === 0 && <ActionRow text="Upload your first file" />}
              {!creator.is_published && <ActionRow text="Publish your creator page" />}
              {completion === 100 && stats.subs === 0 && <ActionRow text="Share your launch post on social" />}
            </ul>
          </div>
          <div className="card-soft">
            <h2 className="text-lg font-bold text-ink">Quick actions</h2>
            <div className="mt-4 grid gap-2">
              <QA icon={Upload} label="Upload new file" />
              <QA icon={Layers} label="Create a tier" />
              <QA icon={Megaphone} label="Post an update" />
              <QA icon={Share2} label="Share your page" />
            </div>
          </div>
        </div>

        <div className="mt-10 card-soft">
          <h2 className="text-lg font-bold text-ink">Files, tiers, subscribers and analytics</h2>
          <p className="mt-2 text-sm text-ink-soft">Full management UIs land in the next update — your data is already wired up and stored securely.</p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card-soft">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</div>
      <div className="mt-2 text-3xl font-bold text-ink">{value}</div>
    </div>
  );
}
function ActionRow({ text }: { text: string }) {
  return (
    <li className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
      <span className="font-medium text-ink">{text}</span>
      <Plus className="h-4 w-4 text-primary" />
    </li>
  );
}
function QA({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <button className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left text-sm font-medium text-ink hover:border-primary">
      <Icon className="h-4 w-4 text-primary" /> {label}
    </button>
  );
}
