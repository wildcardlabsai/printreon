import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader, EmptyState, StatusBadge } from "@/components/admin/AdminUI";
import { CreationMethodBadge, ReviewStatusBadge } from "@/components/QualityBadges";
import { listFilesForReview, reviewFile } from "@/functions/quality.functions";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/stl-library")({ component: STLLibrary });

function STLLibrary() {
  const [tab, setTab] = useState<"review" | "all">("review");
  const [rows, setRows] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);

  const listQueue = useServerFn(listFilesForReview);
  const decide = useServerFn(reviewFile);

  const refresh = async () => {
    const { data } = await supabase
      .from("creator_files")
      .select(
        "id, title, slug, category, file_type, file_size, is_free, tier_required_id, is_published, status, download_count, takedown_at, created_at, creator_id, creation_method, review_status, creator_profiles(display_name, slug)"
      )
      .order("created_at", { ascending: false })
      .limit(500);
    setRows(data ?? []);
  };

  const refreshQueue = async () => {
    setLoadingQueue(true);
    try {
      const r = await listQueue(undefined as any);
      setQueue(r.files ?? []);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not load the review queue");
    } finally {
      setLoadingQueue(false);
    }
  };

  useEffect(() => { refresh(); refreshQueue(); }, []);

  const setStatus = async (id: string, status: string, is_published: boolean) => {
    await supabase.from("creator_files").update({ status, is_published }).eq("id", id);
    await supabase.from("admin_activity_log").insert({ action: `file.${status}`, target_type: "creator_file", target_id: id });
    toast.success(`Set ${status}`);
    refresh();
  };

  return (
    <div className="p-8">
      <PageHeader title="STL Library" subtitle={`${rows.length} files · ${queue.length} awaiting review`} />

      <div className="mb-4 flex gap-2">
        {(["review", "all"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-ink-soft"}`}
          >
            {t === "review" ? `Awaiting review (${queue.length})` : "All files"}
          </button>
        ))}
      </div>

      {tab === "review" ? (
        loadingQueue ? (
          <div className="flex items-center gap-2 text-sm text-ink-soft"><Loader2 className="h-4 w-4 animate-spin" />Loading queue…</div>
        ) : queue.length === 0 ? (
          <EmptyState title="Nothing waiting for review." />
        ) : (
          <div className="grid gap-3">
            {queue.map((f) => (
              <ReviewCard
                key={f.id}
                file={f}
                onDecide={async (decision, notes) => {
                  await decide({ data: { fileId: f.id, decision, notes: notes || undefined } });
                  toast.success(decision === "approve" ? "Approved and published" : "Rejected");
                  await Promise.all([refreshQueue(), refresh()]);
                }}
              />
            ))}
          </div>
        )
      ) : rows.length === 0 ? (
        <EmptyState title="No STL files uploaded yet." />
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase text-ink-soft">
              <tr>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Creator</th>
                <th className="px-3 py-2">Origin</th>
                <th className="px-3 py-2">Access</th>
                <th className="px-3 py-2">Downloads</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => (
                <tr key={f.id} className="border-t border-border">
                  <td className="px-3 py-2 font-semibold">{f.title}</td>
                  <td className="px-3 py-2 text-xs">{f.creator_profiles?.display_name ?? "—"}</td>
                  <td className="px-3 py-2 text-xs"><CreationMethodBadge method={f.creation_method} /></td>
                  <td className="px-3 py-2 text-xs">{f.is_free ? "free" : f.tier_required_id ? "tier" : "members"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{f.download_count}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <StatusBadge status={f.is_published ? (f.status || "active") : "hidden"} />
                      <ReviewStatusBadge status={f.review_status} />
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right space-x-1">
                    {f.is_published
                      ? <button onClick={() => setStatus(f.id, "hidden", false)} className="btn-ghost h-7 text-xs">Hide</button>
                      : <button onClick={() => setStatus(f.id, "active", true)} className="btn-ghost h-7 text-xs">Restore</button>}
                    <button onClick={() => setStatus(f.id, "flagged", f.is_published)} className="btn-ghost h-7 text-xs text-destructive">Flag</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ReviewCard({ file, onDecide }: { file: any; onDecide: (d: "approve" | "reject", notes: string) => Promise<void> }) {
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const thumb = Array.isArray(file.preview_images) && file.preview_images.length > 0
    ? (typeof file.preview_images[0] === "string" ? file.preview_images[0] : file.preview_images[0]?.url)
    : null;
  const flags: string[] = Array.isArray(file.quality_flags) ? file.quality_flags : [];

  const run = async (d: "approve" | "reject") => {
    if (d === "reject" && !notes.trim()) return toast.error("Tell the creator why so they can fix it.");
    setBusy(true);
    try { await onDecide(d, notes.trim()); } catch (e: any) { toast.error(e?.message ?? "Failed"); } finally { setBusy(false); }
  };

  return (
    <div className="flex flex-wrap gap-4 rounded-lg border border-border bg-card p-4">
      {thumb ? (
        <img src={thumb} alt="" loading="lazy" className="h-24 w-24 rounded-md bg-secondary object-cover" />
      ) : (
        <div className="h-24 w-24 rounded-md bg-secondary" />
      )}
      <div className="min-w-[240px] flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-ink">{file.title}</h3>
          <ReviewStatusBadge status={file.review_status} />
          <CreationMethodBadge method={file.creation_method} />
        </div>
        <div className="mt-1 text-xs text-ink-soft">
          {file.creator_profiles?.display_name ?? "—"}
          {!file.creator_profiles?.trusted_at && " · new creator"} · {file.category} · {file.file_type?.toUpperCase()} ·{" "}
          {file.file_size ? (file.file_size / 1024 / 1024).toFixed(2) + " MB" : "—"}
          {file.dim_x != null && <> · {file.dim_x} × {file.dim_y} × {file.dim_z} mm</>}
          {file.triangle_count != null && <> · {Number(file.triangle_count).toLocaleString()} tris</>}
        </div>
        {file.ai_disclosure_note && (
          <p className="mt-2 rounded-md bg-secondary p-2 text-xs text-ink-soft">Creator note: {file.ai_disclosure_note}</p>
        )}
        {flags.length > 0 && (
          <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-amber-700">
            {flags.map((x) => <li key={x}>{x}</li>)}
          </ul>
        )}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Notes to the creator (required to reject)"
          className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
        <div className="mt-2 flex gap-2">
          <button onClick={() => run("approve")} disabled={busy} className="btn-primary h-8 px-3 text-xs">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve & publish"}
          </button>
          <button onClick={() => run("reject")} disabled={busy} className="btn-ghost h-8 px-3 text-xs text-destructive">Reject</button>
        </div>
      </div>
    </div>
  );
}
