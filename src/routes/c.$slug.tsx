import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Heart, Lock, Download, Globe, Instagram, Youtube, Loader2, MessageSquare, Bookmark, Share2, Flag } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { getFileDownloadUrl } from "@/server/downloads.functions";
import { creatorUrl, SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/c/$slug")({
  component: CreatorPage,
});

function CreatorPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [creator, setCreator] = useState<any>(null);
  const [tiers, setTiers] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [following, setFollowing] = useState(false);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: cp } = await supabase.from("creator_profiles").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
      if (!cp) { setNotFoundFlag(true); return; }
      setCreator(cp);
      const [{ data: t }, { data: f }, { data: p }] = await Promise.all([
        supabase.from("creator_tiers").select("*").eq("creator_id", cp.id).eq("is_active", true).order("price"),
        supabase.from("creator_files").select("*").eq("creator_id", cp.id).eq("is_published", true).order("created_at", { ascending: false }),
        supabase.from("creator_posts").select("*").eq("creator_id", cp.id).eq("status", "published").order("published_at", { ascending: false }).limit(10),
      ]);
      setTiers(t ?? []);
      setFiles(f ?? []);
      setPosts(p ?? []);
      if (user) {
        const { data: fol } = await supabase.from("followers").select("id").eq("user_id", user.id).eq("creator_id", cp.id).maybeSingle();
        setFollowing(!!fol);
        const { data: wl } = await supabase.from("wishlist").select("file_id").eq("user_id", user.id);
        setWishlist(new Set((wl ?? []).map((w) => w.file_id)));
      }
    })();
  }, [slug, user]);

  const downloadFn = useServerFn(getFileDownloadUrl);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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

  const toggleWishlist = async (fileId: string) => {
    if (!user) { toast.error("Sign in to save"); return; }
    if (wishlist.has(fileId)) {
      await supabase.from("wishlist").delete().eq("user_id", user.id).eq("file_id", fileId);
      const n = new Set(wishlist); n.delete(fileId); setWishlist(n);
    } else {
      await supabase.from("wishlist").insert({ user_id: user.id, file_id: fileId });
      setWishlist(new Set([...wishlist, fileId]));
    }
  };

  const startDM = async () => {
    if (!user) { toast.error("Sign in to message"); return; }
    const { data: existing } = await supabase.from("dm_threads").select("id").eq("creator_id", creator.id).eq("member_user_id", user.id).maybeSingle();
    if (!existing) {
      await supabase.from("dm_threads").insert({ creator_id: creator.id, member_user_id: user.id });
    }
    navigate({ to: "/me" });
  };

  const reportCreator = async () => {
    if (!user) return toast.error("Sign in to report");
    const reason = window.prompt("Why are you reporting this creator?");
    if (!reason) return;
    await supabase.from("admin_reports").insert({ creator_id: creator.id, reason, reported_by: user.id });
    toast.success("Reported. Admins will review.");
  };

  const sharePage = async () => {
    const url = creatorUrl(creator.slug);
    try { await navigator.clipboard.writeText(url); toast.success("Link copied: " + url); }
    catch { window.prompt("Copy this link:", url); }
  };

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
          <div className="flex flex-wrap gap-2">
            <button onClick={toggleFollow} className={following ? "btn-primary" : "btn-ghost"}>
              <Heart className={`mr-2 h-4 w-4 ${following ? "fill-current" : ""}`} /> {following ? "Following" : "Follow"}
            </button>
            <button onClick={startDM} className="btn-ghost"><MessageSquare className="mr-2 h-4 w-4" />Message</button>
            <button onClick={sharePage} className="btn-ghost"><Share2 className="mr-2 h-4 w-4" />Share</button>
            <button onClick={reportCreator} className="btn-ghost" title="Report"><Flag className="h-4 w-4" /></button>
          </div>
        </div>

        {posts.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-ink">Posts</h2>
            <div className="mt-4 space-y-4">
              {posts.map((p) => (
                <article key={p.id} className="card-soft">
                  {p.cover_image_url && <img src={p.cover_image_url} alt="" className="mb-4 aspect-video w-full rounded-lg object-cover" />}
                  <h3 className="text-lg font-bold text-ink">{p.title}</h3>
                  <p className="mt-1 text-xs text-ink-soft">{new Date(p.published_at ?? p.created_at).toLocaleDateString()}</p>
                  <p className="mt-3 whitespace-pre-line text-ink-soft">{p.body}</p>
                </article>
              ))}
            </div>
          </div>
        )}

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
                <div className="aspect-video overflow-hidden rounded-lg bg-secondary flex items-center justify-center text-ink-soft text-xs">
                  {f.preview_images && Array.isArray(f.preview_images) && f.preview_images[0]
                    ? <img src={f.preview_images[0]} alt="" className="h-full w-full object-cover" />
                    : "STL preview"}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <h3 className="font-semibold text-ink">{f.title}</h3>
                  {f.is_free ? (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-primary">Free</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-ink-soft"><Lock className="h-3 w-3" />Locked</span>
                  )}
                </div>
                {f.category && <p className="mt-1 text-xs text-ink-soft">{f.category}</p>}
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-soft">
                  {f.material && <span className="rounded-full bg-secondary px-2 py-0.5">{f.material}</span>}
                  {f.print_time_minutes && <span className="rounded-full bg-secondary px-2 py-0.5">{Math.round(f.print_time_minutes/60)}h print</span>}
                  {f.supports_required != null && <span className="rounded-full bg-secondary px-2 py-0.5">{f.supports_required ? "Supports" : "No supports"}</span>}
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => handleDownload(f.id)} disabled={downloadingId === f.id} className="btn-ghost flex-1">
                    {downloadingId === f.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Download
                  </button>
                  <button onClick={() => toggleWishlist(f.id)} className="btn-ghost" title="Save to wishlist">
                    <Bookmark className={`h-4 w-4 ${wishlist.has(f.id) ? "fill-current text-primary" : ""}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
