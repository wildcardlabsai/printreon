import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState, StatusBadge } from "@/components/admin/AdminUI";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/support")({ component: Support });

function Support() {
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState("open");

  const refresh = async () => {
    let q = supabase.from("support_tickets").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setRows(data ?? []);
  };
  useEffect(() => { refresh(); }, [filter]);

  const update = async (id: string, patch: any) => {
    await supabase.from("support_tickets").update(patch).eq("id", id);
    await supabase.from("admin_activity_log").insert({ action: `ticket.${Object.keys(patch)[0]}`, target_type: "support_ticket", target_id: id, metadata: patch });
    toast.success("Updated");
    refresh();
  };

  return (
    <div className="p-8">
      <PageHeader title="Support" subtitle="Customer support inbox" />
      <div className="mb-4 flex gap-2">
        {["open", "pending", "resolved", "closed", "all"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded text-xs ${filter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-ink-soft"}`}>{s}</button>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState title="No support tickets open." />
      ) : (
        <div className="space-y-3">
          {rows.map((t) => (
            <div key={t.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{t.subject}</div>
                  <div className="text-xs text-ink-soft">{t.email} · {new Date(t.created_at).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <StatusBadge status={t.priority || "normal"} />
                  <StatusBadge status={t.status} />
                </div>
              </div>
              <p className="mt-3 text-sm whitespace-pre-wrap">{t.body}</p>
              <textarea
                defaultValue={t.admin_notes ?? ""}
                onBlur={(e) => update(t.id, { admin_notes: e.target.value })}
                placeholder="Internal notes…"
                rows={2}
                className="mt-3 w-full rounded border border-input bg-background p-2 text-xs"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <select value={t.priority || "normal"} onChange={(e) => update(t.id, { priority: e.target.value })} className="rounded border border-input bg-background px-2 py-1 text-xs">
                  {["low","normal","high","urgent"].map((p) => <option key={p}>{p}</option>)}
                </select>
                {t.status !== "resolved" && <button onClick={() => update(t.id, { status: "resolved" })} className="btn-ghost h-8 text-xs">Mark resolved</button>}
                {t.status !== "closed" && <button onClick={() => update(t.id, { status: "closed" })} className="btn-ghost h-8 text-xs">Close</button>}
                <a href={`mailto:${t.email}?subject=Re: ${encodeURIComponent(t.subject)}`} className="btn-ghost h-8 text-xs">Reply via email</a>
              </div>
              <p className="mt-2 text-xs text-ink-soft">Email integration not configured — manual response required.</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
