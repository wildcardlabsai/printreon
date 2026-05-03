import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Heart, Lock, Download, Globe, Instagram, Youtube, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { getFileDownloadUrl } from "@/server/downloads.functions";

export const Route = createFileRoute("/c/$slug")({
  component: CreatorPage,
});

function CreatorPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const [creator, setCreator] = useState<any>(null);
  const [tiers, setTiers] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [following, setFollowing] = useState(false);
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: cp } = await supabase.from("creator_profiles").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
      if (!cp) { setNotFoundFlag(true); return; }
      setCreator(cp);
      const [{ data: t }, { data: f }] = await Promise.all([
        supabase.from("creator_tiers").select("*").eq("creator_id", cp.id).eq("is_active", true).order("price"),
        supabase.from("creator_files").select("*").eq("creator_id", cp.id).eq("is_published", true).order("created_at", { ascending: false }),
      ]);
      setTiers(t ?? []);
      setFiles(f ?? []);
      if (user) {
        const { data: fol } = await supabase.from("followers").select("id").eq("user_id", user.id).eq("creator_id", cp.id).maybeSingle();
        setFollowing(!!fol);
      }
    })();
  }, [slug, user]);

  if (notFoundFlag) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container-page py-20 text-center">
          <h1 className="text-3xl font-bold text-ink">Creator not found</h1>
          <Link to="/explore" className="btn-primary mt-6 inline-flex">Explore creators</Link>
        </div>
      </div>
    );
  }
  if (!creator) return <div className="min-h-screen bg-background"><SiteHeader /></div>;

  const toggleFollow = async () => {
    if (!user) { toast.error("Sign in to follow"); return; }
    if (following) {
      await supabase.from("followers").delete().eq("user_id", user.id).eq("creator_id", creator.id);
      setFollowing(false);
    } else {
      await supabase.from("followers").insert({ user_id: user.id, creator_id: creator.id });
      setFollowing(true);
    }
  };

  const downloadFn = useServerFn(getFileDownloadUrl);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (fileId: string) => {
    if (!user) { toast.error("Sign in to download"); return; }
    setDownloadingId(fileId);
    try {
      const { url } = await downloadFn({ data: { fileId } });
      window.location.href = url;
    } catch (e: any) {
      toast.error(e?.message ?? "Download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="aspect-[5/1] w-full bg-gradient-to-br from-accent to-secondary" style={creator.banner_image_url ? { backgroundImage: `url(${creator.banner_image_url})`, backgroundSize: "cover" } : undefined} />
      <div className="container-page -mt-16 pb-20">
        <div className="card-soft flex flex-wrap items-center gap-5">
          {creator.profile_image_url ? (
            <img src={creator.profile_image_url} alt="" className="h-24 w-24 rounded-full border-4 border-card object-cover" />
          ) : (
            <div className="h-24 w-24 rounded-full border-4 border-card bg-accent text-primary flex items-center justify-center text-3xl font-bold">{creator.display_name[0]}</div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-ink md:text-3xl">{creator.display_name}</h1>
            {creator.short_intro && <p className="mt-1 text-ink-soft">{creator.short_intro}</p>}
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-ink-soft">
              {creator.website_url && <a href={creator.website_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-primary"><Globe className="h-4 w-4" />Website</a>}
              {creator.instagram_url && <a href={creator.instagram_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-primary"><Instagram className="h-4 w-4" />Instagram</a>}
              {creator.youtube_url && <a href={creator.youtube_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-primary"><Youtube className="h-4 w-4" />YouTube</a>}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleFollow} className={following ? "btn-primary" : "btn-ghost"}>
              <Heart className={`mr-2 h-4 w-4 ${following ? "fill-current" : ""}`} /> {following ? "Following" : "Follow"}
            </button>
          </div>
        </div>

        {creator.bio && (
          <div className="card-soft mt-6">
            <h2 className="text-lg font-bold text-ink">About</h2>
            <p className="mt-2 whitespace-pre-line text-ink-soft">{creator.bio}</p>
          </div>
        )}

        <h2 className="mt-10 text-2xl font-bold text-ink">Membership tiers</h2>
        {tiers.length === 0 ? (
          <p className="mt-2 text-ink-soft">This creator hasn't published tiers yet.</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {tiers.map((t) => (
              <div key={t.id} className="card-soft flex flex-col">
                <h3 className="text-lg font-bold text-ink">{t.name}</h3>
                <div className="mt-2 text-3xl font-bold text-ink">${Number(t.price).toFixed(0)}<span className="text-base font-medium text-ink-soft">/mo</span></div>
                {Array.isArray(t.benefits) && (
                  <ul className="mt-4 space-y-1 text-sm text-ink-soft">
                    {t.benefits.map((b: string, i: number) => <li key={i}>• {b}</li>)}
                  </ul>
                )}
                <button className="btn-primary mt-6 w-full" disabled>Subscribe (coming soon)</button>
              </div>
            ))}
          </div>
        )}

        <h2 className="mt-12 text-2xl font-bold text-ink">Files</h2>
        {files.length === 0 ? (
          <div className="card-soft mt-4 text-center">
            <p className="text-ink-soft">No files published yet — check back soon.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {files.map((f) => (
              <div key={f.id} className="card-soft">
                <div className="aspect-video overflow-hidden rounded-lg bg-secondary" />
                <div className="mt-3 flex items-center justify-between">
                  <h3 className="font-semibold text-ink">{f.title}</h3>
                  {f.is_free ? (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-primary">Free</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-ink-soft"><Lock className="h-3 w-3" />Locked</span>
                  )}
                </div>
                {f.category && <p className="mt-1 text-xs text-ink-soft">{f.category}</p>}
                <button className="btn-ghost mt-4 w-full" disabled={!f.is_free}>
                  <Download className="mr-2 h-4 w-4" />{f.is_free ? "Download (login required)" : "Subscribe to unlock"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
