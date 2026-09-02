import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useDiscoveryEnabled } from "@/lib/use-discovery";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useServerFn } from "@tanstack/react-start";
import { getFileDownloadUrl, getFilePreviewUrl } from "@/functions/downloads.functions";
import { submitPrintReport } from "@/functions/quality.functions";
import { canPreview } from "@/lib/mesh-preview";
import { STLViewerModal } from "@/components/STLViewer";
import { Download, Loader2, Box, ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/me/downloads")({
  component: DownloadsPage,
});

function DownloadsPage() {
  const discoveryEnabled = useDiscoveryEnabled();
  const { user } = useAuth();
  const [items, setItems] = useState<any[] | null>(null);
  const downloadFn = useServerFn(getFileDownloadUrl);
  const [busyId, setBusyId] = useState<string | null>(null);
  const previewFn = useServerFn(getFilePreviewUrl);
  const [previewBusyId, setPreviewBusyId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; title: string; fileType: string | null } | null>(null);

  const openPreview = async (f: any) => {
    setPreviewBusyId(f.id);
    try {
      const { url, fileType } = await previewFn({ data: { fileId: f.id } });
      setPreview({ url, title: f.title, fileType: fileType ?? f.file_type ?? null });
    } catch (e: any) { toast.error(e?.message ?? "Preview unavailable"); }
    finally { setPreviewBusyId(null); }
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("downloads")
        .select("id, downloaded_at, file_id, creator_files(id, title, file_type, file_size, slug, preview_images), creator_profiles:creator_id(display_name, slug)")
        .eq("user_id", user.id)
        .order("downloaded_at", { ascending: false })
        .limit(200);
      setItems(data ?? []);
    })();
  }, [user]);

  const redownload = async (fileId: string) => {
    setBusyId(fileId);
    try {
      const { url } = await downloadFn({ data: { fileId } });
      window.location.href = url;
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setBusyId(null); }
  };

  if (items === null) return <div className="card-soft h-32 animate-pulse" />;

  if (items.length === 0) {
    return (
      <div className="card-soft text-center">
        <Download className="mx-auto h-10 w-10 text-primary" />
        <h3 className="mt-3 text-xl font-bold text-ink">No downloads yet</h3>
        <p className="mt-1 text-ink-soft">Subscribe to a creator and grab their files anytime.</p>
        {discoveryEnabled ? (
          <Link to="/explore" className="btn-primary mt-5 inline-flex">Find creators</Link>
        ) : (
          <Link to="/explore" className="btn-primary mt-5 inline-flex">Creators coming soon — join the waitlist</Link>
        )}
      </div>
    );
  }

  return (
    <div className="card-soft p-0 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-secondary text-left text-xs uppercase text-ink-soft">
          <tr><th className="px-4 py-3">File</th><th className="px-4 py-3">Creator</th><th className="px-4 py-3">Date</th><th className="px-4 py-3"></th></tr>
        </thead>
        <tbody>
          {items.map((d) => {
            const pi = d.creator_files?.preview_images;
            const thumb = Array.isArray(pi) && pi.length > 0
              ? (typeof pi[0] === "string" ? pi[0] : pi[0]?.url)
              : null;
            return (
            <tr key={d.id} className="border-t border-border">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {thumb ? (
                    <img src={thumb} alt="" loading="lazy" className="h-10 w-10 flex-shrink-0 rounded-md object-cover bg-secondary" />
                  ) : (
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-secondary text-ink-soft">
                      <Download className="h-4 w-4" />
                    </div>
                  )}
                  <span className="font-medium text-ink">{d.creator_files?.title ?? "—"}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                {d.creator_profiles?.slug ? (
                  <Link to="/c/$slug" params={{ slug: d.creator_profiles.slug }} className="text-primary hover:underline">{d.creator_profiles.display_name}</Link>
                ) : "—"}
              </td>
              <td className="px-4 py-3 text-ink-soft">{new Date(d.downloaded_at).toLocaleString()}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                {canPreview(d.creator_files?.file_type) && (
                  <button disabled={previewBusyId === d.file_id} onClick={() => openPreview(d.creator_files)} className="btn-ghost mr-1 h-8 px-3 text-xs" title="3D preview">
                    {previewBusyId === d.file_id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Box className="h-3 w-3" />}
                  </button>
                )}
                <button disabled={busyId === d.file_id} onClick={() => redownload(d.file_id)} className="btn-ghost h-8 px-3 text-xs">
                  {busyId === d.file_id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                </button>
                <PrintOutcome fileId={d.file_id} />
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
      {preview && (
        <STLViewerModal open url={preview.url} title={preview.title} fileType={preview.fileType} onClose={() => setPreview(null)} />
      )}
    </div>
  );
}

function PrintOutcome({ fileId }: { fileId: string }) {
  const report = useServerFn(submitPrintReport);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const send = async (outcome: "success" | "failed") => {
    setBusy(true);
    try {
      await report({ data: { fileId, outcome } });
      setDone(outcome);
      toast.success(outcome === "success" ? "Thanks — logged as a good print" : "Thanks — the creator will see this");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save your report");
    } finally {
      setBusy(false);
    }
  };

  if (done) return <span className="ml-1 text-xs text-ink-soft">{done === "success" ? "Printed fine" : "Reported"}</span>;

  return (
    <span className="ml-1 inline-flex items-center gap-1">
      <button disabled={busy} onClick={() => send("success")} className="btn-ghost h-8 px-2 text-xs" title="It printed fine">
        <ThumbsUp className="h-3 w-3" />
      </button>
      <button disabled={busy} onClick={() => send("failed")} className="btn-ghost h-8 px-2 text-xs text-destructive" title="It didn't print">
        <ThumbsDown className="h-3 w-3" />
      </button>
    </span>
  );
}
