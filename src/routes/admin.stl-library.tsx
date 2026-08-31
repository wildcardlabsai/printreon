import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState, StatusBadge } from "@/components/admin/AdminUI";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/stl-library")({ component: STLLibrary });

function STLLibrary() {
  const [rows, setRows] = useState<any[]>([]);

  const refresh = async () => {
    const { data } = await supabase
      .from("creator_files")
      .select(
        "id, title, slug, category, file_type, file_size, is_free, is_published, status, download_count, takedown_at, created_at, creator_id, creator_profiles(display_name, slug)"
      )
      .order("created_at", { ascending: false })
      .limit(500);
    setRows(data ?? []);
  };
  useEffect(() => { refresh(); }, []);

  const setStatus = async (id: string, status: string, is_published: boolean) => {
    await supabase.from("creator_files").update({ status, is_published }).eq("id", id);
    await supabase.from("admin_activity_log").insert({ action: `file.${status}`, target_type: "creator_file", target_id: id });
    toast.success(`Set ${status}`);
    refresh();
  };

  return (
    <div className="p-8">
      <PageHeader title="STL Library" subtitle={`${rows.length} files`} />
      {rows.length === 0 ? (
        <EmptyState title="No STL files uploaded yet." />
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase text-ink-soft">
              <tr>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Creator</th>
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
                  <td className="px-3 py-2 text-xs">{f.is_free ? "free" : f.tier_required_id ? "tier" : "members"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{f.download_count}</td>
                  <td className="px-3 py-2"><StatusBadge status={f.is_published ? (f.status || "active") : "hidden"} /></td>
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
