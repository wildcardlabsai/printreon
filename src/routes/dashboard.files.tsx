import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/EmptyState";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useCreatorProfile } from "@/lib/use-creator-profile";
import { useServerFn } from "@tanstack/react-start";
import { notifyOnPublish } from "@/functions/notify.functions";
import { Upload, Trash2, Eye, EyeOff, Lock, Unlock, FileBox, Loader2, Box, Image as ImageIcon, Sliders, Camera, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { canPreview, MAX_PREVIEW_BYTES, renderThumbnails, qualityFlags, CREATION_METHODS, isLegacyCreationMethod, type MeshStats } from "@/lib/mesh-preview";
import { STLViewerModal, PrintSettingsChips } from "@/components/STLViewer";
import { FileBadge, ReviewStatusBadge } from "@/components/QualityBadges";

import { getFilePreviewUrl, deleteCreatorFile } from "@/functions/downloads.functions";

export const Route = createFileRoute("/dashboard/files")({
  component: FilesPage,
});

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

const ACCEPTED = ".stl,.3mf,.obj,.zip,.step,.stp,.gcode,.lys,.chitubox,.ctb,.pdf,.png,.jpg,.jpeg";

const FILE_COLUMNS =
  "id, creator_id, title, slug, description, file_type, file_size, preview_images, tags, category, tier_required_id, is_free, is_published, download_count, created_at, updated_at, print_time_minutes, material, supports_required, layer_height_mm, infill_percent, recommended_printer, scheduled_at, status, version, takedown_at, dim_x, dim_y, dim_z, triangle_count, creation_method, ai_disclosure_note, review_status, review_notes, quality_flags, print_verified_image_url, print_verified_at, raw_ai_confirmed_at";

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
  const [material, setMaterial] = useState("");
  const [layerHeight, setLayerHeight] = useState("");
  const [infill, setInfill] = useState("");
  const [printTime, setPrintTime] = useState("");
  const [printer, setPrinter] = useState("");
  const [supports, setSupports] = useState<"" | "yes" | "no">("");
  const [settingsOpenId, setSettingsOpenId] = useState<string | null>(null);

  // disclosure + automatic mesh checks
  const [creationMethod, setCreationMethod] = useState<string>("");
  const [aiNote, setAiNote] = useState("");
  const [noRawAi, setNoRawAi] = useState(false);
  const [checking, setChecking] = useState(false);
  const [check, setCheck] = useState<{ blobs: Blob[]; stats: MeshStats; flags: string[]; fatal: string | null } | null>(null);

  const refresh = async () => {
    if (!creator) return;
    const [{ data: f }, { data: t }] = await Promise.all([
      supabase
        .from("creator_files")
        .select(FILE_COLUMNS)
        .eq("creator_id", creator.id)
        .order("created_at", { ascending: false }),
      supabase.from("creator_tiers").select("*").eq("creator_id", creator.id).order("price"),
    ]);
    setFiles(f ?? []);
    setTiers(t ?? []);
  };

  useEffect(() => { refresh(); }, [creator]);

  // Run the mesh sanity checks as soon as a file is picked.
  const onPick = async (f: File | null) => {
    setPickedFile(f);
    setCheck(null);
    if (!f || !canPreview(f.name)) return;
    if (f.size > MAX_PREVIEW_BYTES) return;
    setChecking(true);
    try {
      const { blobs, stats } = await renderThumbnails(f, 3);
      const flags = qualityFlags(stats, f.size);
      const fatal = blobs.length === 0
        ? "We couldn't render this model — it may be corrupt."
        : flags.find((x) => x.includes("no usable geometry")) ?? null;
      setCheck({ blobs, stats, flags, fatal });
    } catch (e: any) {
      setCheck({ blobs: [], stats: { dimX: 0, dimY: 0, dimZ: 0, triangleCount: 0 }, flags: [], fatal: e?.message ?? "This file could not be opened as a 3D model." });
    } finally {
      setChecking(false);
    }
  };

  // 3D preview
  const previewFn = useServerFn(getFilePreviewUrl);
  const deleteFileFn = useServerFn(deleteCreatorFile);
  const [preview, setPreview] = useState<{ url: string; title: string; fileType: string | null; settings: any } | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const openPreview = async (f: any) => {
    setPreviewLoadingId(f.id);
    try {
      const { url, fileType } = await previewFn({ data: { fileId: f.id } });
      setPreview({ url, title: f.title, fileType: fileType ?? f.file_type, settings: f });
    } catch (e: any) {

      toast.error(e?.message ?? "Preview unavailable");
    } finally {
      setPreviewLoadingId(null);
    }
  };

  // Generate/refresh thumbnails for an already-uploaded file
  const [thumbBusyId, setThumbBusyId] = useState<string | null>(null);
  const regenerateThumbs = async (f: any) => {
    if (!user || !creator) return;
    setThumbBusyId(f.id);
    try {
      const { url } = await previewFn({ data: { fileId: f.id } });
      if (!url) throw new Error("Could not read the stored file");
      const blob = await fetch(url).then((r) => r.blob());
      if (blob.size > MAX_PREVIEW_BYTES) throw new Error("File is too large to render previews");
      const asFile = new File([blob], `${f.slug}.${f.file_type ?? "stl"}`);
      const { blobs, stats } = await renderThumbnails(asFile, 3);
      const urls: string[] = [];
      for (let i = 0; i < blobs.length; i++) {
        const thumbPath = `${user.id}/${creator.id}/${f.id}-${i}.webp`;
        const { error: upErr } = await supabase.storage
          .from("previews")
          .upload(thumbPath, blobs[i], { contentType: "image/webp", upsert: true });
        if (upErr) continue;
        urls.push(supabase.storage.from("previews").getPublicUrl(thumbPath).data.publicUrl + `?v=${Date.now()}`);
      }
      await supabase.from("creator_files").update({
        preview_images: urls,
        dim_x: stats.dimX,
        dim_y: stats.dimY,
        dim_z: stats.dimZ,
        triangle_count: stats.triangleCount,
        quality_flags: qualityFlags(stats, Number(f.file_size ?? 0)),
      }).eq("id", f.id);
      toast.success("Previews generated");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not generate previews");
    } finally {
      setThumbBusyId(null);
    }
  };

  const upload = async () => {
    if (!user || !creator || !pickedFile || !title || !creationMethod || !noRawAi) return;
    if (check?.fatal) {
      toast.error(check.fatal);
      return;
    }
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
        material: material || null,
        layer_height_mm: layerHeight ? Number(layerHeight) : null,
        infill_percent: infill ? Number(infill) : null,
        print_time_minutes: printTime ? Number(printTime) : null,
        recommended_printer: printer || null,
        supports_required: supports === "" ? null : supports === "yes",
        creation_method: creationMethod,
        ai_disclosure_note: creationMethod === "ai_assisted" ? (aiNote || null) : null,
        raw_ai_confirmed_at: new Date().toISOString(),
        quality_flags: check?.flags ?? [],
        ...(check?.stats
          ? { dim_x: check.stats.dimX, dim_y: check.stats.dimY, dim_z: check.stats.dimZ, triangle_count: check.stats.triangleCount }
          : {}),
      }).select("id").single();
      if (insErr) throw insErr;

      // Upload the thumbnails rendered during the file check (best effort).
      if (inserted && check && check.blobs.length > 0) {
        try {
          setProgress("Saving previews…");
          const urls: string[] = [];
          for (let i = 0; i < check.blobs.length; i++) {
            const thumbPath = `${user.id}/${creator.id}/${inserted.id}-${i}.webp`;
            const { error: thumbErr } = await supabase.storage
              .from("previews")
              .upload(thumbPath, check.blobs[i], { contentType: "image/webp", upsert: true });
            if (thumbErr) continue;
            urls.push(supabase.storage.from("previews").getPublicUrl(thumbPath).data.publicUrl);
          }
          await supabase.from("creator_files").update({ preview_images: urls }).eq("id", inserted.id);
        } catch {
          // previews are optional — the upload itself succeeded
        }
      }

      toast.success("File uploaded — review and publish below");
      setTitle(""); setDescription(""); setPickedFile(null); setTierRequired(""); setIsFree(false);
      setMaterial(""); setLayerHeight(""); setInfill(""); setPrintTime(""); setPrinter(""); setSupports("");
      setCreationMethod(""); setAiNote(""); setNoRawAi(false); setCheck(null);

      if (inputRef.current) inputRef.current.value = "";
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally { setBusy(false); setProgress(""); }
  };

  const notify = useServerFn(notifyOnPublish);
  const togglePublish = async (f: any) => {
    const willPublish = !f.is_published;
    if (willPublish && !f.creation_method) {
      return toast.error("Set how this model was made before publishing.");
    }
    const { data: updated, error } = await supabase
      .from("creator_files")
      .update({ is_published: willPublish })
      .eq("id", f.id)
      .select("is_published, review_status")
      .maybeSingle();
    if (error) return toast.error(error.message);

    if (willPublish && updated && !updated.is_published) {
      toast.success("Sent for review — we check the first few files from every new creator.");
    } else if (willPublish) {
      try {
        const r = await notify({ data: { kind: "file", itemId: f.id } });
        if (r.notified > 0) toast.success(`Published — notified ${r.notified} ${r.notified === 1 ? "person" : "people"}`);
        else toast.success("Published");
      } catch { toast.success("Published"); }
    }
    await refresh();
  };

  // Print-verified photo
  const [verifyBusyId, setVerifyBusyId] = useState<string | null>(null);
  const uploadPrintProof = async (f: any, photo: File) => {
    if (!user || !creator) return;
    setVerifyBusyId(f.id);
    try {
      const ext = photo.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${user.id}/${creator.id}/verify-${f.id}.${ext}`;
      const { error: upErr } = await supabase.storage.from("previews").upload(path, photo, {
        contentType: photo.type || "image/jpeg",
        upsert: true,
      });
      if (upErr) throw upErr;
      const url = supabase.storage.from("previews").getPublicUrl(path).data.publicUrl + `?v=${Date.now()}`;
      const { error } = await supabase.from("creator_files").update({
        print_verified_image_url: url,
        print_verified_at: new Date().toISOString(),
      }).eq("id", f.id);
      if (error) throw error;
      toast.success("Print verified — buyers will see the badge and your photo");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save the photo");
    } finally {
      setVerifyBusyId(null);
    }
  };

  const remove = async (f: any) => {
    if (!confirm(`Delete "${f.title}"? This is permanent.`)) return;
    try {
      await deleteFileFn({ data: { fileId: f.id } });
      toast.success("Deleted");
    } catch (e: any) {
      return toast.error(e?.message ?? "Could not delete this file");
    }
    await refresh();
  };

  const untrusted = creator && !(creator as any).trusted_at;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="card-soft lg:col-span-1">
        <h2 className="text-lg font-bold text-ink">Upload a new file</h2>
        <p className="mt-1 text-sm text-ink-soft">STL, 3MF, OBJ, ZIP and more — up to 200MB.</p>
        {untrusted && (
          <p className="mt-3 rounded-lg bg-secondary p-3 text-xs text-ink-soft">
            You're new here, so your first 3 published files get a quick human review before they go live. After that everything publishes instantly.
          </p>
        )}
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

          <div className="rounded-xl border border-border p-3">
            <div className="text-xs font-bold uppercase tracking-wide text-ink-soft">Badge &amp; disclosure</div>
            <p className="mt-1 text-xs text-ink-soft">
              Required. Buyers see this badge on your file. Add a photo of the real print afterwards to upgrade it to{" "}
              <strong className="text-ink">Print-Tested</strong>.
            </p>
            <div className="mt-3">
              <select value={creationMethod} onChange={(e) => setCreationMethod(e.target.value)} className={inp}>
                <option value="">Choose a badge…</option>
                {CREATION_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              {creationMethod && (
                <p className="mt-1.5 text-xs text-ink-soft">{CREATION_METHODS.find((m) => m.value === creationMethod)?.help}</p>
              )}
            </div>
            {creationMethod === "ai_assisted" && (
              <div className="mt-3">
                <Field label="What did you repair, retopologise or rescale?">
                  <textarea value={aiNote} onChange={(e) => setAiNote(e.target.value)} rows={2} className={inp} placeholder="Generated the base shape, then remeshed, fixed non-manifold edges, hollowed it and rescaled to mm." />
                </Field>
              </div>
            )}
            <label className="mt-3 flex items-start gap-2 text-xs text-ink-soft">
              <input type="checkbox" checked={noRawAi} onChange={(e) => setNoRawAi(e.target.checked)} className="mt-0.5" />
              <span>
                I confirm this is not a raw, unedited AI export. The mesh is watertight, free of inverted normals and correctly scaled for slicers.
              </span>
            </label>
          </div>

          <div className="rounded-xl border border-border p-3">
            <div className="text-xs font-bold uppercase tracking-wide text-ink-soft">Recommended print settings</div>
            <p className="mt-1 text-xs text-ink-soft">Optional — shown on the file card so buyers know how you printed it.</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Material">
                <input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="PLA" className={inp} />
              </Field>
              <Field label="Layer height (mm)">
                <input value={layerHeight} onChange={(e) => setLayerHeight(e.target.value)} type="number" step="0.01" placeholder="0.2" className={inp} />
              </Field>
              <Field label="Infill (%)">
                <input value={infill} onChange={(e) => setInfill(e.target.value)} type="number" min="0" max="100" placeholder="15" className={inp} />
              </Field>
              <Field label="Print time (mins)">
                <input value={printTime} onChange={(e) => setPrintTime(e.target.value)} type="number" min="0" placeholder="180" className={inp} />
              </Field>
              <Field label="Supports">
                <select value={supports} onChange={(e) => setSupports(e.target.value as any)} className={inp}>
                  <option value="">Not specified</option>
                  <option value="yes">Required</option>
                  <option value="no">Not needed</option>
                </select>
              </Field>
              <Field label="Printer">
                <input value={printer} onChange={(e) => setPrinter(e.target.value)} placeholder="Bambu P1S" className={inp} />
              </Field>
            </div>
          </div>

          <Field label="File">
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED}
              onChange={(e) => onPick(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground"
            />
            {pickedFile && <div className="mt-1 text-xs text-ink-soft">{pickedFile.name} ({(pickedFile.size / 1024 / 1024).toFixed(2)} MB)</div>}
          </Field>

          {checking && (
            <div className="flex items-center gap-2 text-xs text-ink-soft"><Loader2 className="h-4 w-4 animate-spin" />Checking the model…</div>
          )}
          {check?.fatal && (
            <div className="rounded-lg bg-destructive/10 p-3 text-xs font-semibold text-destructive">{check.fatal}</div>
          )}
          {check && !check.fatal && check.flags.length > 0 && (
            <div className="rounded-lg bg-amber-500/10 p-3 text-xs text-amber-800">
              <div className="mb-1 flex items-center gap-1 font-bold"><AlertTriangle className="h-3.5 w-3.5" />Worth a second look</div>
              <ul className="list-disc space-y-0.5 pl-4">{check.flags.map((f) => <li key={f}>{f}</li>)}</ul>
              <p className="mt-1.5">You can still upload, but this file will be reviewed before it goes live.</p>
            </div>
          )}
          {check && !check.fatal && check.flags.length === 0 && (
            <div className="rounded-lg bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-700">
              Model looks good — {check.stats.dimX} × {check.stats.dimY} × {check.stats.dimZ} mm, {check.stats.triangleCount.toLocaleString()} triangles.
            </div>
          )}

          <button onClick={upload} disabled={busy || checking || !title || !pickedFile || !creationMethod || !noRawAi || !!check?.fatal} className="btn-primary w-full">
            {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{progress || "Working…"}</> : <><Upload className="mr-2 h-4 w-4" />Upload file</>}
          </button>
          {pickedFile && !creationMethod && <p className="text-xs text-ink-soft">Choose a badge to continue.</p>}
          {pickedFile && creationMethod && !noRawAi && <p className="text-xs text-ink-soft">Confirm the file isn't a raw AI export to continue.</p>}
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
              const flags: string[] = Array.isArray(f.quality_flags) ? f.quality_flags : [];
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
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-ink truncate">{f.title}</h3>
                    {f.is_published ? (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-primary">LIVE</span>
                    ) : (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-ink-soft">DRAFT</span>
                    )}
                    <ReviewStatusBadge status={f.review_status} />
                    <FileBadge file={f} />
                    {f.is_free ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><Unlock className="h-3 w-3" />Free</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-ink-soft"><Lock className="h-3 w-3" />Locked</span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-ink-soft">
                    {f.category} · {f.file_type?.toUpperCase() ?? "—"} · {f.file_size ? (f.file_size / 1024 / 1024).toFixed(2) + " MB" : "no file"} · {f.download_count} downloads
                    {f.dim_x != null && <> · {f.dim_x} × {f.dim_y} × {f.dim_z} mm</>}
                    {f.triangle_count != null && <> · {Number(f.triangle_count).toLocaleString()} tris</>}
                  </div>
                  {flags.length > 0 && (
                    <div className="mt-1 text-xs text-amber-700">{flags.join(" ")}</div>
                  )}
                  {f.review_status === "rejected" && f.review_notes && (
                    <div className="mt-1 text-xs text-destructive">Reviewer: {f.review_notes}</div>
                  )}
                  {(!f.creation_method || isLegacyCreationMethod(f.creation_method)) && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-ink-soft">
                        {f.creation_method ? "Confirm this file's badge under the new standards:" : "Which badge applies?"}
                      </span>
                      <select
                        defaultValue=""
                        onChange={async (e) => {
                          if (!e.target.value) return;
                          await supabase.from("creator_files").update({ creation_method: e.target.value }).eq("id", f.id);
                          await refresh();
                        }}
                        className="rounded-lg border border-input bg-background px-2 py-1 text-xs"
                      >
                        <option value="">Choose…</option>
                        {CREATION_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {f.file_type && canPreview(f.file_type) && (
                    <>
                      <button onClick={() => openPreview(f)} disabled={previewLoadingId === f.id} className="btn-ghost h-9 px-3" title="3D preview">
                        {previewLoadingId === f.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Box className="h-4 w-4" />}
                      </button>
                      <button onClick={() => regenerateThumbs(f)} disabled={thumbBusyId === f.id} className="btn-ghost h-9 px-3" title={thumb ? "Regenerate thumbnails" : "Generate thumbnails"}>
                        {thumbBusyId === f.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                      </button>
                    </>
                  )}
                  <label className="btn-ghost h-9 cursor-pointer px-3" title={f.print_verified_at ? "Replace print photo" : "Add a photo of the real print"}>
                    {verifyBusyId === f.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => { const p = e.target.files?.[0]; if (p) uploadPrintProof(f, p); e.target.value = ""; }}
                    />
                  </label>
                  <button onClick={() => setSettingsOpenId(settingsOpenId === f.id ? null : f.id)} className="btn-ghost h-9 px-3" title="Recommended print settings">
                    <Sliders className="h-4 w-4" />
                  </button>
                  <button onClick={() => togglePublish(f)} disabled={f.review_status === "pending"} className="btn-ghost h-9 px-3">
                    {f.is_published ? <><EyeOff className="mr-1 h-4 w-4" />Unpublish</> : <><Eye className="mr-1 h-4 w-4" />Publish</>}
                  </button>
                  <button onClick={() => remove(f)} className="btn-ghost h-9 px-3 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {settingsOpenId !== f.id && <PrintSettingsChips settings={f} className="w-full" />}
                {settingsOpenId === f.id && (
                  <PrintSettingsEditor
                    file={f}
                    onSaved={async () => { setSettingsOpenId(null); await refresh(); }}
                  />
                )}
              </li>

              );
            })}
          </ul>
        )}
      </div>
      {preview && (
        <STLViewerModal
          open
          url={preview.url}
          title={preview.title}
          fileType={preview.fileType}
          settings={preview.settings}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}

function PrintSettingsEditor({ file, onSaved }: { file: any; onSaved: () => void | Promise<void> }) {
  const [material, setMaterial] = useState(file.material ?? "");
  const [layerHeight, setLayerHeight] = useState(file.layer_height_mm ?? "");
  const [infill, setInfill] = useState(file.infill_percent ?? "");
  const [printTime, setPrintTime] = useState(file.print_time_minutes ?? "");
  const [printer, setPrinter] = useState(file.recommended_printer ?? "");
  const [supports, setSupports] = useState(file.supports_required == null ? "" : file.supports_required ? "yes" : "no");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("creator_files").update({
      material: material || null,
      layer_height_mm: layerHeight === "" ? null : Number(layerHeight),
      infill_percent: infill === "" ? null : Number(infill),
      print_time_minutes: printTime === "" ? null : Number(printTime),
      recommended_printer: printer || null,
      supports_required: supports === "" ? null : supports === "yes",
    }).eq("id", file.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Print settings saved");
    await onSaved();
  };

  return (
    <div className="w-full rounded-xl border border-border p-3">
      <div className="text-xs font-bold uppercase tracking-wide text-ink-soft">Recommended print settings</div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Field label="Material">
          <input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="PLA" className={inp} />
        </Field>
        <Field label="Layer height (mm)">
          <input value={layerHeight} onChange={(e) => setLayerHeight(e.target.value)} type="number" step="0.01" placeholder="0.2" className={inp} />
        </Field>
        <Field label="Infill (%)">
          <input value={infill} onChange={(e) => setInfill(e.target.value)} type="number" min="0" max="100" placeholder="15" className={inp} />
        </Field>
        <Field label="Print time (mins)">
          <input value={printTime} onChange={(e) => setPrintTime(e.target.value)} type="number" min="0" placeholder="180" className={inp} />
        </Field>
        <Field label="Supports">
          <select value={supports} onChange={(e) => setSupports(e.target.value)} className={inp}>
            <option value="">Not specified</option>
            <option value="yes">Required</option>
            <option value="no">Not needed</option>
          </select>
        </Field>
        <Field label="Printer">
          <input value={printer} onChange={(e) => setPrinter(e.target.value)} placeholder="Bambu P1S" className={inp} />
        </Field>
      </div>
      <button onClick={save} disabled={saving} className="btn-primary mt-3 h-9 px-4 text-sm">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save settings"}
      </button>
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
