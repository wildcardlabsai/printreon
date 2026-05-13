import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/admin/AdminUI";

export const Route = createFileRoute("/admin/activity-log")({ component: Log });

function Log() {
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => { (async () => {
    const { data } = await supabase.from("admin_activity_log").select("*").order("created_at", { ascending: false }).limit(500);
    setRows(data ?? []);
  })(); }, []);

  const filtered = rows.filter((r) => !filter || r.action.includes(filter) || (r.target_type ?? "").includes(filter));

  return (
    <div className="p-8">
      <PageHeader title="Activity Log" subtitle="Every admin action is recorded." />
      <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by action / target" className="mb-4 w-72 rounded border border-input bg-background px-3 py-2 text-sm" />
      {filtered.length === 0 ? (
        <EmptyState title="No activity yet." />
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase text-ink-soft">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Target</th>
                <th className="px-3 py-2">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-2 text-xs text-ink-soft">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.action}</td>
                  <td className="px-3 py-2 text-xs">{r.target_type ?? "—"}</td>
                  <td className="px-3 py-2 text-xs font-mono text-ink-soft truncate max-w-md">{r.metadata && Object.keys(r.metadata).length ? JSON.stringify(r.metadata) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
