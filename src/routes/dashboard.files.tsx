import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/EmptyState";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useCreatorProfile } from "@/lib/use-creator-profile";
import { useServerFn } from "@tanstack/react-start";
import { notifyOnPublish } from "@/functions/notify.functions";
import { Upload, Trash2, Eye, EyeOff, Lock, Unlock, FileBox, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { canPreview, MAX_PREVIEW_BYTES, renderThumbnails } from "@/lib/mesh-preview";
import { STLViewerModal } from "@/components/STLViewer";
import { getFilePreviewUrl } from "@/functions/downloads.functions";

export const Route = createFileRoute("/dashboard/files")({
  component: FilesPage,
});

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

const ACCEPTED = ".stl,.3mf,.obj,.zip,.step,.stp,.gcode,.lys,.chitubox,.ctb,.pdf,.png,.jpg,.jpeg";

function FilesPage() {
  const { user } = useAuth();
  const { creator } = useCreatorProfile();
  const [files, setFiles] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  // form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Miniatures");
  const [isFree, setIsFree] = useState(false);
  const [tierRequired, setTierRequired] = useState<string>("");
  const [pickedFile, setPickedFile] = useState<File | null>(null);

  const refresh = async () => {
    if (!creator) return;
    const [{ data: f }, { data: t }] = await Promise.all([
      supabase.from("creator_files").select("*").eq("creator_id", creator.id).order("created_at", { ascending: false }),
      supabase.from("creator_tiers").select("*").eq("creator_id", creator.id).order("price"),
    ]);
    setFiles(f ?? []);
    setTiers(t ?? []);
  };

  useEffect(() => { refresh(); }, [creator]);

  const upload = async () => {
    if (!user || !creator || !pickedFile || !title) return;
    setBusy(true);
    setProgress("Uploading…");
    try {
      const ext = pickedFile.name.split(".").pop()?.toLowerCase() ?? "bin";
      const path = `${user.id}/${creator.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("files").upload(path, pickedFile, {
        contentType: pickedFile.type || "application/octet-stream",
        upsert: false,
      });
      if (upErr) throw upErr;
      setProgress("Saving…");
      const { data: inserted, error: insErr } = await supabase.from("creator_files").insert({
        creator_id: creator.id,
        title,
        slug: slugify(title) + "-" + Math.random().toString(36).slice(2, 6),
        description,
        category,
        is_free: isFree,
        is_published: false,
        tier_required_id: tierRequired || null,
        file_url: path,
        file_type: ext,
        file_size: pickedFile.size,
      }).select("id").single();
      if (insErr) throw insErr;

      // Auto-generate thumbnails + mesh metadata in the browser (best effort).
      if (inserted && canPreview(pickedFile.name) && pickedFile.size <= MAX_PREVIEW_BYTES) {
        try {
          setProgress("Rendering previews…");
          const { blobs, stats } = await renderThumbnails(pickedFile, 3);
          const urls: string[] = [];
          for (let i = 0; i < blobs.length; i++) {
            const thumbPath = `${creator.id}/${inserted.id}-${i}.webp`;
            const { error: thumbErr } = await supabase.storage
              .from("previews")
              .upload(thumbPath, blobs[i], { contentType: "image/webp", upsert: true });
            if (thumbErr) continue;
            urls.push(supabase.storage.from("previews").getPublicUrl(thumbPath).data.publicUrl);
          }
          await supabase.from("creator_files").update({
            preview_images: urls,
            dim_x: stats.dimX,
            dim_y: stats.dimY,
            dim_z: stats.dimZ,
            triangle_count: stats.triangleCount,
          }).eq("id", inserted.id);
        } catch {
          // previews are optional — the upload itself succeeded
        }
      }

      toast.success("File uploaded — review and publish below");
      setTitle(""); setDescription(""); setPickedFile(null); setTierRequired(""); setIsFree(false);
      if (inputRef.current) inputRef.current.value = "";
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally { setBusy(false); setProgress(""); }
  };

  const notify = useServerFn(notifyOnPublish);
  const togglePublish = async (f: any) => {
    const willPublish = !f.is_published;
    const { error } = await supabase.from("creator_files").update({ is_published: willPublish }).eq("id", f.id);
    if (error) return toast.error(error.message);
    if (willPublish) {
      try {
        const r = await notify({ data: { kind: "file", itemId: f.id } });
        if (r.notified > 0) toast.success(`Published — notified ${r.notified} ${r.notified === 1 ? "person" : "people"}`);
        else toast.success("Published");
      } catch { toast.success("Published"); }
    }
    await refresh();
  };

  const remove = async (f: any) => {
    if (!confirm(`Delete "${f.title}"? This is permanent.`)) return;
    if (f.file_url) await supabase.storage.from("files").remove([f.file_url]);
    const { error } = await supabase.from("creator_files").delete().eq("id", f.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    await refresh();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="card-soft lg:col-span-1">
        <h2 className="text-lg font-bold text-ink">Upload a new file</h2>
        <p className="mt-1 text-sm text-ink-soft">STL, 3MF, OBJ, ZIP and more — up to 200MB.</p>
        <div className="mt-4 space-y-3">
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inp} />
          </Field>
          <Field label="Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inp} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inp}>
                {["Miniatures", "Cosplay", "Functional", "Toys", "Home decor", "Tools", "Art", "Tabletop gaming", "Seasonal"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Access">
              <select
                value={isFree ? "free" : tierRequired ? "tier" : "any"}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "free") { setIsFree(true); setTierRequired(""); }
                  else if (v === "any") { setIsFree(false); setTierRequired(""); }
                  else { setIsFree(false); }
                }}
                className={inp}
              >
                <option value="free">Free with account</option>
                <option value="any">Any active subscriber</option>
                <option value="tier">Specific tier or higher</option>
              </select>
            </Field>
          </div>
          {!isFree && (
            <Field label="Required tier">
              <select value={tierRequired} onChange={(e) => setTierRequired(e.target.value)} className={inp} disabled={tiers.length === 0}>
                <option value="">Any tier</option>
                {tiers.map((t) => <option key={t.id} value={t.id}>{t.name} (${Number(t.price).toFixed(0)}/mo)</option>)}
              </select>
            </Field>
          )}
          <Field label="File">
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED}
              onChange={(e) => setPickedFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground"
            />
            {pickedFile && <div className="mt-1 text-xs text-ink-soft">{pickedFile.name} ({(pickedFile.size / 1024 / 1024).toFixed(2)} MB)</div>}
          </Field>
          <button onClick={upload} disabled={busy || !title || !pickedFile} className="btn-primary w-full">
            {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{progress || "Working…"}</> : <><Upload className="mr-2 h-4 w-4" />Upload file</>}
          </button>
        </div>
      </div>

      <div className="lg:col-span-2">
        <h2 className="text-lg font-bold text-ink">Your library ({files.length})</h2>
        {files.length === 0 ? (
          <EmptyState
            icon={FileBox}
            title="Your library is empty"
            description="Upload your first STL or 3MF on the left. You can keep it as a draft, set it as a freebie, or lock it behind a tier."
          />
        ) : (
          <ul className="mt-3 grid gap-3">
            {files.map((f) => {
              const thumb = Array.isArray(f.preview_images) && f.preview_images.length > 0
                ? (typeof f.preview_images[0] === "string" ? f.preview_images[0] : f.preview_images[0]?.url)
                : null;
              return (
              <li key={f.id} className="card-soft flex flex-wrap items-center gap-4">
                {thumb ? (
                  <img
                    src={thumb}
                    alt=""
                    loading="lazy"
                    className="h-16 w-16 flex-shrink-0 rounded-md object-cover bg-secondary"
                  />
                ) : (
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md bg-secondary text-ink-soft">
                    <FileBox className="h-6 w-6" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-ink truncate">{f.title}</h3>
                    {f.is_published ? (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-primary">LIVE</span>
                    ) : (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-ink-soft">DRAFT</span>
                    )}
                    {f.is_free ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><Unlock className="h-3 w-3" />Free</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-ink-soft"><Lock className="h-3 w-3" />Locked</span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-ink-soft">
                    {f.category} · {f.file_type?.toUpperCase() ?? "—"} · {f.file_size ? (f.file_size / 1024 / 1024).toFixed(2) + " MB" : "no file"} · {f.download_count} downloads
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => togglePublish(f)} className="btn-ghost h-9 px-3">
                    {f.is_published ? <><EyeOff className="mr-1 h-4 w-4" />Unpublish</> : <><Eye className="mr-1 h-4 w-4" />Publish</>}
                  </button>
                  <button onClick={() => remove(f)} className="btn-ghost h-9 px-3 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

const inp = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
