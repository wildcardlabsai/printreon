import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useCreatorProfile } from "@/lib/use-creator-profile";
import { Plus, Upload, Megaphone, Layers, Share2, Copy } from "lucide-react";
import { toast } from "sonner";
import { creatorUrl } from "@/lib/site";
import { creatorEarningsSummary, type EarningsSummary } from "@/functions/earnings.functions";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

function Overview() {
  const { creator } = useCreatorProfile();
  const [stats, setStats] = useState({ subs: 0, files: 0, downloads: 0, mrr: 0, followers: 0 });
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const loadEarnings = useServerFn(creatorEarningsSummary);

  useEffect(() => {
    loadEarnings({ data: undefined })
      .then(setEarnings)
      .catch(() => setEarnings(null));
  }, [loadEarnings]);


  useEffect(() => {
    if (!creator) return;
    (async () => {
      const [{ count: filesCount }, { data: subsRows }, { count: dlCount }, { count: folCount }] = await Promise.all([
        supabase.from("creator_files").select("*", { count: "exact", head: true }).eq("creator_id", creator.id),
        supabase.from("subscriptions").select("tier_id, status, creator_tiers(price)").eq("creator_id", creator.id).eq("status", "active"),
        supabase.from("downloads").select("*", { count: "exact", head: true }).eq("creator_id", creator.id),
        supabase.from("followers").select("*", { count: "exact", head: true }).eq("creator_id", creator.id),
      ]);
      const mrr = (subsRows ?? []).reduce((sum: number, r: any) => sum + Number(r.creator_tiers?.price ?? 0), 0);
      setStats({
        subs: subsRows?.length ?? 0,
        files: filesCount ?? 0,
        downloads: dlCount ?? 0,
        followers: folCount ?? 0,
        mrr,
      });
    })();
  }, [creator]);

  if (!creator) return null;

  const completion = (() => {
    let s = 0;
    if (creator.display_name) s += 15;
    if (creator.bio) s += 15;
    if (creator.profile_image_url) s += 20;
    if (creator.banner_image_url) s += 15;
    if (creator.is_published) s += 20;
    if (stats.files > 0) s += 15;
    return s;
  })();

  const publicUrl = creatorUrl(creator.slug);

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Monthly recurring" value={`$${stats.mrr.toFixed(2)}`} />
        <Stat label="Active subscribers" value={stats.subs} />
        <Stat label="Files" value={stats.files} />
        <Stat label="Followers" value={stats.followers} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Link to="/dashboard/earnings" className="card-soft transition-colors hover:border-primary">
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Earned this month</div>
          <div className="mt-2 text-3xl font-bold text-ink">${(earnings?.thisMonth ?? 0).toFixed(2)}</div>
          <div className="mt-1 text-xs text-ink-soft">View earnings →</div>
        </Link>
        <Link to="/dashboard/earnings" className="card-soft transition-colors hover:border-primary">
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Lifetime earnings</div>
          <div className="mt-2 text-3xl font-bold text-ink">${(earnings?.lifetime ?? 0).toFixed(2)}</div>
          <div className="mt-1 text-xs text-ink-soft">After platform &amp; processing fees</div>
        </Link>
      </div>


      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="card-soft lg:col-span-2">
          <h2 className="text-lg font-bold text-ink">Profile completion</h2>
          <p className="mt-1 text-sm text-ink-soft">{completion}% complete — keep momentum.</p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-primary transition-all" style={{ width: `${completion}%` }} />
          </div>
          <ul className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
            {!creator.profile_image_url && <Action to="/dashboard/settings" text="Add profile image" />}
            {!creator.banner_image_url && <Action to="/dashboard/settings" text="Add banner image" />}
            {!creator.bio && <Action to="/dashboard/settings" text="Write your bio" />}
            {stats.files === 0 && <Action to="/dashboard/files" text="Upload your first file" />}
            {!creator.is_published && <Action to="/dashboard/settings" text="Publish your page" />}
          </ul>
        </div>
        <div className="card-soft">
          <h2 className="text-lg font-bold text-ink">Quick actions</h2>
          <div className="mt-4 grid gap-2">
            <QA to="/dashboard/files" icon={Upload} label="Upload new file" />
            <QA to="/dashboard/tiers" icon={Layers} label="Create a tier" />
            <QA to="/dashboard/announcements" icon={Megaphone} label="Post update" />
            <button
              onClick={() => {
                navigator.clipboard.writeText(publicUrl);
                toast.success("Link copied");
              }}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left text-sm font-medium text-ink hover:border-primary"
            >
              <Share2 className="h-4 w-4 text-primary" /> Copy share link
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 card-soft">
        <h2 className="text-lg font-bold text-ink">Your public link</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-ink-soft">
            {publicUrl}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(publicUrl);
              toast.success("Copied");
            }}
            className="btn-ghost h-10"
          >
            <Copy className="mr-2 h-4 w-4" /> Copy
          </button>
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
function Action({ to, text }: { to: string; text: string }) {
  return (
    <li>
      <Link to={to as any} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 hover:border-primary">
        <span className="font-medium text-ink">{text}</span>
        <Plus className="h-4 w-4 text-primary" />
      </Link>
    </li>
  );
}
function QA({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <Link to={to as any} className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left text-sm font-medium text-ink hover:border-primary">
      <Icon className="h-4 w-4 text-primary" /> {label}
    </Link>
  );
}
