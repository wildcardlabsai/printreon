import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useDiscoveryEnabled } from "@/lib/use-discovery";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useServerFn } from "@tanstack/react-start";
import { getFileDownloadUrl, getFilePreviewUrl } from "@/functions/downloads.functions";
import { canPreview } from "@/lib/mesh-preview";
import { STLViewerModal, PrintSettingsChips } from "@/components/STLViewer";
import { getStripeEnvironment } from "@/lib/stripe";
import { EmptyState } from "@/components/EmptyState";
import { Library, Download, Loader2, Box, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/me/library")({
  component: LibraryPage,
});

function LibraryPage() {
  const discoveryEnabled = useDiscoveryEnabled();
  const { user } = useAuth();
  const [creators, setCreators] = useState<any[] | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [activeCreator, setActiveCreator] = useState<string>("all");
  const [query, setQuery] = useState("");

  const downloadFn = useServerFn(getFileDownloadUrl);
  const previewFn = useServerFn(getFilePreviewUrl);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [previewBusyId, setPreviewBusyId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; title: string; fileType: string | null; settings: any } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("creator_id, tier_id, creator_profiles(id, display_name, slug, profile_image_url), creator_tiers(price)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .eq("environment", getStripeEnvironment());

      const list = (subs ?? []).filter((s: any) => s.creator_profiles);
      setCreators(list);
      if (list.length === 0) return;

      const ids = list.map((s: any) => s.creator_id);
      const { data: f } = await supabase
        .from("creator_files")
        .select("id, title, slug, category, file_type, file_size, preview_images, is_free, tier_required_id, dim_x, dim_y, dim_z, material, layer_height_mm, infill_percent, print_time_minutes, recommended_printer, supports_required, creator_id, created_at, creator_tiers:tier_required_id(price, name), creator_profiles(display_name, slug)")
        .in("creator_id", ids)
        .eq("is_published", true)
        .is("takedown_at", null)
        .order("created_at", { ascending: false })
        .limit(300);
      setFiles(f ?? []);
    })();
  }, [user]);

  const paidPriceByCreator = useMemo(() => {
    const m = new Map<string, number>();
    (creators ?? []).forEach((s: any) => {
      const p = Number(s.creator_tiers?.price ?? 0);
      m.set(s.creator_id, Math.max(m.get(s.creator_id) ?? 0, p));
    });
    return m;
  }, [creators]);

  const unlocked = (f: any) => {
    if (f.is_free) return true;
    const required = Number(f.creator_tiers?.price ?? 0);
    return (paidPriceByCreator.get(f.creator_id) ?? 0) >= required;
  };

  const q = query.trim().toLowerCase();
  const shown = files.filter(
    (f) =>
      (activeCreator === "all" || f.creator_id === activeCreator) &&
      (!q || f.title.toLowerCase().includes(q) || (f.category ?? "").toLowerCase().includes(q))
  );

  const download = async (f: any) => {
    setBusyId(f.id);
    try {
      const { url } = await downloadFn({ data: { fileId: f.id } });
      window.location.href = url;
    } catch (e: any) { toast.error(e?.message ?? "Download failed"); }
    finally { setBusyId(null); }
  };

  const openPreview = async (f: any) => {
    setPreviewBusyId(f.id);
    try {
      const { url, fileType } = await previewFn({ data: { fileId: f.id } });
      setPreview({ url, title: f.title, fileType: fileType ?? f.file_type ?? null, settings: f });
    } catch (e: any) { toast.error(e?.message ?? "Preview unavailable"); }
    finally { setPreviewBusyId(null); }
  };

  if (creators === null) {
    return <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card-soft h-56 animate-pulse" />)}</div>;
  }

  if (creators.length === 0) {
    return (
      <EmptyState
        icon={Library}
        title="No creator files yet"
        description="Once you subscribe to a creator, every file they publish shows up here — ready to preview and download."
      >
        {discoveryEnabled ? (
          <Link to="/explore" className="btn-primary inline-flex">Explore creators <ArrowRight className="ml-2 h-4 w-4" /></Link>
        ) : (
          <Link to="/explore" className="btn-primary inline-flex">Creators coming soon — join the waitlist <ArrowRight className="ml-2 h-4 w-4" /></Link>
        )}
      </EmptyState>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Creator library</h1>
          <p className="text-sm text-ink-soft">Every published file from the {creators.length} creator{creators.length === 1 ? "" : "s"} you support.</p>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search files…"
          className="w-56 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <button
          onClick={() => setActiveCreator("all")}
          className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${activeCreator === "all" ? "border-primary bg-primary text-primary-foreground" : "border-border text-ink-soft hover:text-ink"}`}
        >
          All creators
        </button>
        {creators.map((s: any) => (
          <button
            key={s.creator_id}
            onClick={() => setActiveCreator(s.creator_id)}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${activeCreator === s.creator_id ? "border-primary bg-primary text-primary-foreground" : "border-border text-ink-soft hover:text-ink"}`}
          >
            {s.creator_profiles?.profile_image_url && (
              <img src={s.creator_profiles.profile_image_url} alt="" className="h-5 w-5 rounded-full object-cover" />
            )}
            {s.creator_profiles?.display_name}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="card-soft mt-6 text-center text-ink-soft">No files match that filter yet.</div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((f) => {
            const pi = f.preview_images;
            const thumb = Array.isArray(pi) && pi.length > 0 ? (typeof pi[0] === "string" ? pi[0] : pi[0]?.url) : null;
            const ok = unlocked(f);
            return (
              <div key={f.id} className="card-soft flex flex-col">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-secondary">
                  {thumb ? (
                    <img src={thumb} alt={`Preview render of ${f.title}`} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-ink-soft"><Box className="h-8 w-8 opacity-40" /></div>
                  )}
                  {canPreview(f.file_type) && (
                    <span className="absolute right-2 top-2 rounded-full bg-card/90 px-2 py-0.5 text-[10px] font-bold text-ink">3D</span>
                  )}
                </div>
                <h3 className="mt-3 font-semibold text-ink line-clamp-1">{f.title}</h3>
                <Link to="/c/$slug" params={{ slug: f.creator_profiles?.slug ?? "" }} className="text-xs text-primary hover:underline">
                  {f.creator_profiles?.display_name}
                </Link>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-ink-soft">
                  {f.category && <span className="rounded-full bg-secondary px-2 py-0.5">{f.category}</span>}
                  {f.file_type && <span className="rounded-full bg-secondary px-2 py-0.5">{f.file_type.toUpperCase()}</span>}
                  {f.dim_x != null && <span className="rounded-full bg-secondary px-2 py-0.5">{f.dim_x} × {f.dim_y} × {f.dim_z} mm</span>}
                </div>
                <PrintSettingsChips settings={f} className="mt-1.5" />

                <div className="mt-4 flex gap-2">
                  {ok ? (
                    <button onClick={() => download(f)} disabled={busyId === f.id} className="btn-primary h-9 flex-1 text-sm">
                      {busyId === f.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                      Download
                    </button>
                  ) : (
                    <Link to="/c/$slug" params={{ slug: f.creator_profiles?.slug ?? "" }} className="btn-ghost h-9 flex-1 text-sm">
                      <Lock className="mr-2 h-4 w-4" />Upgrade tier
                    </Link>
                  )}
                  {canPreview(f.file_type) && ok && (
                    <button onClick={() => openPreview(f)} disabled={previewBusyId === f.id} className="btn-ghost h-9 px-3" title="3D preview">
                      {previewBusyId === f.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Box className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {preview && (
        <STLViewerModal open url={preview.url} title={preview.title} fileType={preview.fileType} settings={preview.settings} onClose={() => setPreview(null)} />
      )}
    </div>
  );
}
